import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

// ── Validar variables de entorno ──────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceKey) {
  console.error("Error: faltan variables de entorno en .env.local");
  console.error("  NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.");
  process.exit(1);
}

if (!supabaseUrl.includes(".supabase.co")) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL no parece correcta.");
  console.error(`  Recibido: ${supabaseUrl}`);
  console.error("  Debe tener el formato: https://<project-ref>.supabase.co");
  console.error("  La encuentras en: Supabase Dashboard → Settings → API → Project URL");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ── Helpers ───────────────────────────────────────────────────────────────────
async function checkConnection(): Promise<boolean> {
  process.stdout.write("Conectando a Supabase... ");
  const { error } = await supabase.from("DocumentTypes").select("id").limit(1);
  if (error) {
    console.log("FALLÓ");
    console.error(`  → ${error.message}`);
    return false;
  }
  console.log("OK");
  return true;
}

async function isEmpty(table: string): Promise<boolean> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`No se pudo verificar ${table}: ${error.message}`);
  return count === 0;
}

async function seedTable(table: string, rows: object[], summary: string) {
  process.stdout.write(`  ${table.padEnd(16)}`);
  const empty = await isEmpty(table);
  if (!empty) {
    console.log("omitida (ya tiene datos)");
    return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`insertada → ${summary}`);
}

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("=== Smart Parking — Seed ===\n");

  const connected = await checkConnection();
  if (!connected) process.exit(1);

  console.log("\nTablas:\n");

  await seedTable(
    "DocumentTypes",
    [
      { name: "Cédula de Ciudadanía", name_normalized: "CC" },
      { name: "Cédula de Extranjería", name_normalized: "CE" },
      { name: "Pasaporte Extranjero", name_normalized: "PE" },
    ],
    "CC, CE, PE"
  );

  await seedTable(
    "TypeVehicles",
    [{ name: "Automóvil" }, { name: "Moto" }],
    "Automóvil, Moto"
  );

  await seedTable(
    "Roles",
    [
      { name: "Administrador", description: "Gestión total del sistema" },
      { name: "Operador", description: "Gestión operativa del parqueadero" },
      { name: "Conductor", description: "Usuario final que utiliza el parqueadero" },
    ],
    "Administrador, Operador, Conductor"
  );

  // Parkings se maneja aparte para obtener el id y pasárselo a Spaces
  process.stdout.write(`  ${"Parkings".padEnd(16)}`);
  const parkingsEmpty = await isEmpty("Parkings");
  let parkingId: number | undefined;

  if (!parkingsEmpty) {
    console.log("omitida (ya tiene datos)");
    const { data } = await supabase
      .from("Parkings")
      .select("id")
      .eq("name", "Centro Comercial Unicentro")
      .single();
    parkingId = data?.id;
  } else {
    const { data, error } = await supabase
      .from("Parkings")
      .insert({ name: "Centro Comercial Unicentro", latitude: "4.702233388481218", longitude: "-74.04111107855391" })
      .select("id")
      .single();
    if (error) throw new Error(`Parkings: ${error.message}`);
    parkingId = data.id;
    console.log("insertada → Centro Comercial Unicentro");
  }

  if (parkingId !== undefined) {
    await seedTable(
      "Spaces",
      [
        { name: "A-01", id_parking: parkingId, id_typev: 1 },
        { name: "A-02", id_parking: parkingId, id_typev: 1 },
        { name: "M-01", id_parking: parkingId, id_typev: 1 },
        { name: "M-02", id_parking: parkingId, id_typev: 1 },
      ],
      "A-01, A-02 (Automóvil) — M-01, M-02 (Moto)"
    );
  }

  console.log("\nSeed finalizado.");
}

seed().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
