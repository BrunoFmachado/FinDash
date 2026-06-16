const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "findash"
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

function mapTransaction(row) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    date: row.transaction_date,
    accountId: row.account_id || "",
    accountName: row.account_name || "Não vinculada",
    description: row.description || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get("/api/accounts", async (req, res) => {
  try {
    const connection = await getConnection();

    const [rows] = await connection.execute(`
      SELECT
        id,
        name,
        type,
        institution,
        initial_balance AS initialBalance
      FROM accounts
      ORDER BY name ASC
    `);

    await connection.end();

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao listar contas.",
      error: error.message
    });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const {
      type = "",
      status = "",
      search = "",
      dateStart = "",
      dateEnd = ""
    } = req.query;

    const conditions = [];
    const params = [];

    if (type) {
      conditions.push("t.type = ?");
      params.push(type);
    }

    if (status) {
      conditions.push("t.status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push("(t.title LIKE ? OR t.category LIKE ? OR t.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (dateStart) {
      conditions.push("t.transaction_date >= ?");
      params.push(dateStart);
    }

    if (dateEnd) {
      conditions.push("t.transaction_date <= ?");
      params.push(dateEnd);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const connection = await getConnection();

    const [rows] = await connection.execute(`
      SELECT
        t.*,
        a.name AS account_name
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t.account_id
      ${where}
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `, params);

    await connection.end();

    res.json({
      success: true,
      data: rows.map(mapTransaction)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao listar transações.",
      error: error.message
    });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const {
      type,
      status,
      title,
      category,
      amount,
      date,
      accountId,
      description
    } = req.body;

    const id = `trx_${Date.now()}`;

    const connection = await getConnection();

    await connection.execute(`
      INSERT INTO transactions
        (id, type, status, title, category, amount, transaction_date, account_id, description)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      type,
      status || "realized",
      title,
      category,
      amount,
      date,
      accountId || null,
      description || ""
    ]);

    await connection.end();

    res.status(201).json({
      success: true,
      message: "Transação cadastrada com sucesso.",
      id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar transação.",
      error: error.message
    });
  }
});

app.put("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      type,
      status,
      title,
      category,
      amount,
      date,
      accountId,
      description
    } = req.body;

    const connection = await getConnection();

    await connection.execute(`
      UPDATE transactions
      SET
        type = ?,
        status = ?,
        title = ?,
        category = ?,
        amount = ?,
        transaction_date = ?,
        account_id = ?,
        description = ?
      WHERE id = ?
    `, [
      type,
      status || "realized",
      title,
      category,
      amount,
      date,
      accountId || null,
      description || "",
      id
    ]);

    await connection.end();

    res.json({
      success: true,
      message: "Transação atualizada com sucesso."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar transação.",
      error: error.message
    });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getConnection();

    await connection.execute("DELETE FROM transactions WHERE id = ?", [id]);

    await connection.end();

    res.json({
      success: true,
      message: "Transação excluída com sucesso."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao excluir transação.",
      error: error.message
    });
  }
});

app.get("/api/transactions/export", async (req, res) => {
  try {
    const connection = await getConnection();

    const [rows] = await connection.execute(`
      SELECT
        t.type,
        t.status,
        t.title,
        t.category,
        COALESCE(a.name, 'Não vinculada') AS account_name,
        t.transaction_date,
        t.amount,
        t.description
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t.account_id
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `);

    await connection.end();

    const header = [
      "Tipo",
      "Situação",
      "Descrição",
      "Categoria",
      "Conta",
      "Data",
      "Valor",
      "Observação"
    ];

    const lines = rows.map((row) => [
      row.type === "income" ? "Receita" : "Saída financeira",
      row.status === "planned" ? "Previsto" : "Realizado",
      row.title,
      row.category,
      row.account_name,
      row.transaction_date,
      Number(row.amount).toFixed(2).replace(".", ","),
      row.description || ""
    ]);

    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=findash-informacoes-financeiras.csv");
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao exportar transações.",
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`FinDash rodando em http://localhost:${PORT}`);
});