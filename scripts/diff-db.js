const mysql = require('mysql2/promise');

const COMMON = {
  port: 3306,
  user: 'oc_admin',
  password: 'ocADMsrv.42',
  database: 'oc_db',
};

const DEV = { ...COMMON, host: '192.168.150.48' };
const PROD = { ...COMMON, host: '192.168.150.52' };

async function getTables(conn) {
  const [rows] = await conn.execute('SHOW TABLES');
  return rows.map(r => Object.values(r)[0]);
}

async function getColumns(conn, table) {
  const [rows] = await conn.execute(`SHOW FULL COLUMNS FROM \`${table}\``);
  return rows.map(r => ({
    name: r.Field,
    type: r.Type,
    null: r.Null,
    key: r.Key,
    default: r.Default,
    extra: r.Extra,
  }));
}

async function getRowCount(conn, table) {
  try {
    const [rows] = await conn.execute(`SELECT COUNT(*) as cnt FROM \`${table}\``);
    return rows[0].cnt;
  } catch { return '?'; }
}

async function main() {
  console.log('Connexion DEV (192.168.150.48)...');
  const devConn = await mysql.createConnection(DEV);
  console.log('Connexion PROD (192.168.150.52)...');
  const prodConn = await mysql.createConnection(PROD);

  const devTables = await getTables(devConn);
  const prodTables = await getTables(prodConn);

  const allTables = [...new Set([...devTables, ...prodTables])].sort();

  const onlyDev = devTables.filter(t => !prodTables.includes(t));
  const onlyProd = prodTables.filter(t => !devTables.includes(t));
  const common = allTables.filter(t => devTables.includes(t) && prodTables.includes(t));

  console.log('\n========================================');
  console.log('  DIFF oc_db : DEV vs PROD');
  console.log('========================================\n');

  if (onlyDev.length) {
    console.log(`--- Tables UNIQUEMENT sur DEV (${onlyDev.length}) ---`);
    for (const t of onlyDev) {
      const cnt = await getRowCount(devConn, t);
      console.log(`  + ${t} (${cnt} rows)`);
    }
    console.log();
  }

  if (onlyProd.length) {
    console.log(`--- Tables UNIQUEMENT sur PROD (${onlyProd.length}) ---`);
    for (const t of onlyProd) {
      const cnt = await getRowCount(prodConn, t);
      console.log(`  + ${t} (${cnt} rows)`);
    }
    console.log();
  }

  console.log(`--- Tables communes : ${common.length} ---\n`);

  let diffCount = 0;

  for (const table of common) {
    const devCols = await getColumns(devConn, table);
    const prodCols = await getColumns(prodConn, table);

    const devColNames = devCols.map(c => c.name);
    const prodColNames = prodCols.map(c => c.name);

    const onlyDevCols = devColNames.filter(c => !prodColNames.includes(c));
    const onlyProdCols = prodColNames.filter(c => !devColNames.includes(c));

    const typeDiffs = [];
    for (const dc of devCols) {
      const pc = prodCols.find(c => c.name === dc.name);
      if (pc) {
        const diffs = [];
        if (dc.type !== pc.type) diffs.push(`type: ${dc.type} -> ${pc.type}`);
        if (dc.null !== pc.null) diffs.push(`null: ${dc.null} -> ${pc.null}`);
        if (dc.key !== pc.key) diffs.push(`key: ${dc.key} -> ${pc.key}`);
        if (dc.extra !== pc.extra) diffs.push(`extra: ${dc.extra} -> ${pc.extra}`);
        if (diffs.length) typeDiffs.push({ col: dc.name, diffs });
      }
    }

    const devCnt = await getRowCount(devConn, table);
    const prodCnt = await getRowCount(prodConn, table);
    const cntDiff = devCnt !== '?' && prodCnt !== '?' && devCnt !== prodCnt;

    if (onlyDevCols.length || onlyProdCols.length || typeDiffs.length || cntDiff) {
      diffCount++;
      console.log(`[${table}]  DEV: ${devCnt} rows | PROD: ${prodCnt} rows`);
      for (const c of onlyDevCols) {
        const col = devCols.find(x => x.name === c);
        console.log(`    + DEV only:  ${c} (${col.type})`);
      }
      for (const c of onlyProdCols) {
        const col = prodCols.find(x => x.name === c);
        console.log(`    + PROD only: ${c} (${col.type})`);
      }
      for (const td of typeDiffs) {
        console.log(`    ~ ${td.col}: ${td.diffs.join(', ')}`);
      }
      if (cntDiff && !onlyDevCols.length && !onlyProdCols.length && !typeDiffs.length) {
        console.log(`    rows: DEV ${devCnt} vs PROD ${prodCnt}`);
      }
      console.log();
    }
  }

  console.log('========================================');
  console.log(`Resume: ${allTables.length} tables, ${onlyDev.length} DEV-only, ${onlyProd.length} PROD-only, ${diffCount} avec differences`);
  console.log('========================================');

  await devConn.end();
  await prodConn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
