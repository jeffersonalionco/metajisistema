import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { initMetajiSchema } from './dbMetaji.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Metaji Sistemas' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Arquivo ou dados muito grandes. Logo máx. 400 KB.' });
  }
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

async function iniciar() {
  try {
    await initMetajiSchema();
    console.log('Schema metajireceitas: tabela usuarios verificada/criada.');
  } catch (err) {
    console.error('Erro ao inicializar schema metajireceitas:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

iniciar();
