require('dotenv').config();
 
const express = require('express');
const cors    = require('cors');
const db      = require('./db');
const app     = express();
 
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

const autenticar = require('./js/middleware/auth');
 
const userRoutes     = require('./js/features/user/user.routes');
const accountsRoutes = require('./js/features/accounts/accounts.routes');
const transactionsRoutes = require('./js/features/transaction/transactions.routes');
const billsRoutes = require('./js/features/bills/bills.routes');
const goalsRoutes = require('./js/features/goals/goals.routes');
const dashboardRoutes = require('./js/features/dashboard/dashboard.routes');

app.use('/api/users',  userRoutes);
app.use('/api/contas', autenticar, accountsRoutes);
app.use('/api/transacoes', autenticar, transactionsRoutes);
app.use('/api/vencimentos', autenticar, billsRoutes);
app.use('/api/metas', autenticar, goalsRoutes);
app.use('/api/dashboard', autenticar, dashboardRoutes);
 
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.checkDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`FinDash API rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Nao foi possivel conectar ao MySQL.');
    console.error(`Host: ${process.env.DB_HOST || 'localhost'} | Porta: ${process.env.DB_PORT || 3306} | Banco: ${process.env.DB_NAME || 'findash'}`);
    console.error(err.message);
    process.exit(1);
  }
}

startServer();
