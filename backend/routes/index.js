import { Router } from 'express';
import { buscarProdutos } from '../controllers/buscarController.js';
import { getProduto } from '../controllers/produtoController.js';
import { atualizarObs } from '../controllers/produtoObsController.js';
import { getReceita } from '../controllers/receitaController.js';
import { listar, criar, atualizarPermissaoDocumentacao, atualizarPermissoesUsuario } from '../controllers/usuarioController.js';
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
import {
  obterConfigDocumentacaoIA,
  salvarConfigDocumentacaoIA,
  conversarComDocumentacaoIA,
} from '../controllers/documentacaoIAController.js';
import { requireAuth, requireAdmin, requireDocumentacaoEditor, requirePermissao } from '../middleware/auth.js';
import authRoutes from './authRoutes.js';

const router = Router();

router.use(authRoutes);

router.get('/buscar', requireAuth, requirePermissao('pode_receitas', 'Sem permissão para acessar Receitas'), buscarProdutos);
router.get('/produto/:codigo', requireAuth, requirePermissao('pode_receitas', 'Sem permissão para acessar Receitas'), getProduto);
router.patch('/produto/:codigo/obs', requireAuth, requirePermissao('pode_receitas', 'Sem permissão para editar Receitas'), atualizarObs);
router.get('/receita/:codigo', requireAuth, requirePermissao('pode_receitas', 'Sem permissão para acessar Receitas'), getReceita);

router.get('/empresa', requireAuth, requirePermissao('pode_empresa', 'Sem permissão para acessar Empresa'), getEmpresa);
router.put('/empresa', requireAuth, requirePermissao('pode_empresa', 'Sem permissão para editar Empresa'), updateEmpresa);

router.get('/usuarios', requireAuth, requirePermissao('pode_usuarios', 'Sem permissão para gerenciar usuários'), listar);
router.post('/usuarios', requireAuth, requirePermissao('pode_usuarios', 'Sem permissão para cadastrar usuários'), criar);
router.patch('/usuarios/:id/documentacao', requireAuth, requireAdmin, atualizarPermissaoDocumentacao);
router.patch('/usuarios/:id/permissoes', requireAuth, requirePermissao('pode_usuarios', 'Sem permissão para alterar permissões'), atualizarPermissoesUsuario);

// Resumo mensal (Excel + IA) - apenas admin
router.post(
  '/relatorios/analisar',
  requireAuth,
  requirePermissao('pode_relatorios_mensal', 'Sem permissão para gerar resumo mensal'),
  uploadRelatorioMiddleware,
  analisarRelatorio,
);
router.post(
  '/relatorios',
  requireAuth,
  requirePermissao('pode_relatorios_mensal', 'Sem permissão para salvar resumo mensal'),
  salvarResumoMensal,
);
router.get('/relatorios', requireAuth, requirePermissao('pode_relatorios_mensal', 'Sem permissão para ver resumos mensais'), listarResumosMensais);
router.get('/relatorios/validade', requireAuth, requirePermissao('pode_relatorio_validade', 'Sem permissão para relatório de validades'), relatorioValidades);
router.get('/relatorios/:id', obterResumoMensal);

// Documentação da empresa
router.get('/documentacao', requireAuth, listarPosts);
router.get('/documentacao/ia/config', requireAuth, requireAdmin, obterConfigDocumentacaoIA);
router.put('/documentacao/ia/config', requireAuth, requireAdmin, salvarConfigDocumentacaoIA);
router.post('/documentacao/ia/chat', requireAuth, conversarComDocumentacaoIA);
router.get('/documentacao/:id', requireAuth, obterPost);
router.post('/documentacao', requireAuth, requireDocumentacaoEditor, criarPost);
router.put('/documentacao/:id', requireAuth, requireDocumentacaoEditor, atualizarPost);
router.delete('/documentacao/:id', requireAuth, requireDocumentacaoEditor, excluirPost);

export default router;
