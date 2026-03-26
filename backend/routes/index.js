import { Router } from 'express';
import { buscarProdutos } from '../controllers/buscarController.js';
import { getProduto } from '../controllers/produtoController.js';
import { atualizarObs } from '../controllers/produtoObsController.js';
import { getReceita } from '../controllers/receitaController.js';
import { listar, criar } from '../controllers/usuarioController.js';
import { getEmpresa, updateEmpresa } from '../controllers/empresaController.js';
import {
  uploadRelatorioMiddleware,
  analisarRelatorio,
  salvarResumoMensal,
  obterResumoMensal,
  listarResumosMensais,
  relatorioValidades,
} from '../controllers/relatorioController.js';
import {
  listarPosts,
  obterPost,
  criarPost,
  atualizarPost,
  excluirPost,
} from '../controllers/documentacaoController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import authRoutes from './authRoutes.js';

const router = Router();

router.use(authRoutes);

router.get('/buscar', requireAuth, buscarProdutos);
router.get('/produto/:codigo', requireAuth, getProduto);
router.patch('/produto/:codigo/obs', requireAuth, atualizarObs);
router.get('/receita/:codigo', requireAuth, getReceita);

router.get('/empresa', requireAuth, getEmpresa);
router.put('/empresa', requireAuth, requireAdmin, updateEmpresa);

router.get('/usuarios', requireAuth, requireAdmin, listar);
router.post('/usuarios', requireAuth, requireAdmin, criar);

// Resumo mensal (Excel + IA) - apenas admin
router.post(
  '/relatorios/analisar',
  requireAuth,
  requireAdmin,
  uploadRelatorioMiddleware,
  analisarRelatorio,
);
router.post(
  '/relatorios',
  requireAuth,
  requireAdmin,
  salvarResumoMensal,
);
router.get('/relatorios', requireAuth, requireAdmin, listarResumosMensais);
router.get('/relatorios/validade', requireAuth, requireAdmin, relatorioValidades);
router.get('/relatorios/:id', obterResumoMensal);

// Documentação da empresa
router.get('/documentacao', requireAuth, listarPosts);
router.get('/documentacao/:id', requireAuth, obterPost);
router.post('/documentacao', requireAuth, requireAdmin, criarPost);
router.put('/documentacao/:id', requireAuth, requireAdmin, atualizarPost);
router.delete('/documentacao/:id', requireAuth, requireAdmin, excluirPost);

export default router;
