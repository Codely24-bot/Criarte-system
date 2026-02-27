# Criarte Admin Web

Sistema web administrativo para Criarte - Convites e Artes Digitais.

## Inclui
- Login com e-mail/senha
- Recuperacao de senha
- Painel administrativo protegido por sessao
- Dashboard com:
  - Total de clientes
  - Pedidos ativos
  - Pedidos em andamento
  - Pedidos concluidos
  - Pagamentos pendentes
  - Faturamento mensal
  - Grafico de pedidos por mes
  - Entregas proximas
- Cadastro de clientes com:
  - Nome, telefone, e-mail, data e tipo de evento, observacoes
  - Botao de WhatsApp
  - Editar, excluir, historico
- Gestao de pedidos com:
  - Cliente vinculado
  - Tipo de servico
  - Valor
  - Forma e status de pagamento
  - Status do pedido
  - Data de inicio e prazo
  - Upload de arquivo final
  - Destaque automatico de pedidos atrasados
- Controle financeiro:
  - Filtro por periodo
  - Total recebido e pendente
  - Exportacao em PDF via impressao
- Alertas inteligentes:
  - Prazo proximo (2 dias)
  - Pagamento pendente
  - Pedido atrasado
- Tema alternavel:
  - Preto
  - Branco
- Responsivo:
  - Desktop
  - Tablet
  - Celular

## Como usar
1. Abra [index.html](./index.html) no navegador.
2. Credenciais iniciais:
   - E-mail: `admin@criarte.com`
   - Senha: `123456`

## Persistencia
Os dados ficam salvos no `localStorage` do navegador.
