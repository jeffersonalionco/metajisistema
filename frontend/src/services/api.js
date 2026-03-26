import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('receitas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('receitas_token');
      localStorage.removeItem('receitas_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  return data;
}

export async function registro(nome, email, senha) {
  const { data } = await api.post('/auth/registro', { nome, email, senha });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function buscarProdutos(q, filtro) {
  const params = { q: q || '' };
  if (filtro) params.filtro = filtro;
  const { data } = await api.get('/buscar', { params });
  return data;
}

export async function getProduto(codigo) {
  const { data } = await api.get(`/produto/${codigo}`);
  return data;
}

export async function getReceita(codigo) {
  const { data } = await api.get(`/receita/${codigo}`);
  return data;
}

export async function atualizarModoPreparo(codigo, indc_obs) {
  const { data } = await api.patch(`/produto/${codigo}/obs`, { indc_obs });
  return data;
}

export async function listarUsuarios() {
  const { data } = await api.get('/usuarios');
  return data;
}

export async function criarUsuario(dados) {
  const { data } = await api.post('/usuarios', dados);
  return data;
}

export async function atualizarPermissaoDocumentacaoUsuario(id, pode_documentacao) {
  const { data } = await api.patch(`/usuarios/${id}/documentacao`, { pode_documentacao });
  return data;
}

export async function atualizarPermissoesUsuario(id, payload) {
  const { data } = await api.patch(`/usuarios/${id}/permissoes`, payload);
  return data;
}

export async function getEmpresa() {
  const { data } = await api.get('/empresa');
  return data;
}

export async function updateEmpresa(dados) {
  const { data } = await api.put('/empresa', dados);
  return data;
}

export async function analisarRelatorioExcel(arquivo) {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  const { data } = await api.post('/relatorios/analisar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}

export async function salvarResumoMensal(resumo, periodo, nome_relatorio) {
  const { data } = await api.post('/relatorios', { resumo, periodo, nome_relatorio });
  return data;
}

export async function obterResumoMensal(id) {
  const { data } = await api.get(`/relatorios/${id}`);
  return data;
}

export async function listarResumosMensais(filtros = {}) {
  const params = {};
  if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
  if (filtros.data_fim) params.data_fim = filtros.data_fim;
  if (filtros.busca) params.busca = filtros.busca;
  const { data } = await api.get('/relatorios', { params });
  return data;
}

export async function listarValidades(filtros = {}) {
  const params = {};
  if (filtros.data_valid_ini) params.data_valid_ini = filtros.data_valid_ini;
  if (filtros.data_valid_fim) params.data_valid_fim = filtros.data_valid_fim;
  if (filtros.unidade) params.unidade = filtros.unidade;
  if (filtros.fornecedor) params.fornecedor = filtros.fornecedor;
  if (filtros.apenas_vencidos) params.apenas_vencidos = filtros.apenas_vencidos;
  if (filtros.ate_dias) params.ate_dias = filtros.ate_dias;
  const { data } = await api.get('/relatorios/validade', { params });
  return data;
}

export async function listarDocumentacao(filtros = {}) {
  const params = {};
  if (filtros.categoria) params.categoria = filtros.categoria;
  if (filtros.busca) params.busca = filtros.busca;
  if (filtros.apenas_ativos !== undefined) params.apenas_ativos = filtros.apenas_ativos;
  const { data } = await api.get('/documentacao', { params });
  return data;
}

export async function criarPostDocumentacao(dados) {
  const { data } = await api.post('/documentacao', dados);
  return data;
}

export async function atualizarPostDocumentacao(id, dados) {
  const { data } = await api.put(`/documentacao/${id}`, dados);
  return data;
}

export async function excluirPostDocumentacao(id) {
  const { data } = await api.delete(`/documentacao/${id}`);
  return data;
}

export async function obterPostDocumentacao(id) {
  const { data } = await api.get(`/documentacao/${id}`);
  return data;
}

export async function obterConfigIADocumentacao() {
  const { data } = await api.get('/documentacao/ia/config');
  return data;
}

export async function salvarConfigIADocumentacao(payload) {
  const { data } = await api.put('/documentacao/ia/config', payload);
  return data;
}

export async function conversarIADocumentacao(payload) {
  const { data } = await api.post('/documentacao/ia/chat', payload, { timeout: 60000 });
  return data;
}
