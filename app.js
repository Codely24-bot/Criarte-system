const APP_KEY = 'criarte_admin_data_v1'
const SESSION_KEY = 'criarte_admin_session'
const THEME_KEY = 'criarte_admin_theme'

const root = document.getElementById('app')

const state = {
  users: [],
  clients: [],
  orders: [],
  editingClientId: null,
  editingOrderId: null,
  currentView: 'dashboard'
}

const nowDate = () => new Date().toISOString().slice(0, 10)
const id = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const getSession = () => localStorage.getItem(SESSION_KEY)
const setSession = (userId) => localStorage.setItem(SESSION_KEY, userId)
const clearSession = () => localStorage.removeItem(SESSION_KEY)
const getTheme = () => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

const formatMoney = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const saveData = () => {
  localStorage.setItem(APP_KEY, JSON.stringify({ users: state.users, clients: state.clients, orders: state.orders }))
}

const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
  const toggle = document.getElementById('themeToggle')
  if (toggle) toggle.textContent = theme === 'light' ? 'Tema preto' : 'Tema branco'
}

const loadData = () => {
  const raw = localStorage.getItem(APP_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    state.users = parsed.users || []
    state.clients = parsed.clients || []
    state.orders = parsed.orders || []
    return
  }

  state.users = [{ id: 'u-1', email: 'admin@criarte.com', password: '123456', name: 'Admin Criarte' }]
  state.clients = [
    {
      id: 'c-1',
      fullName: 'Carla Mendes',
      phone: '11999998888',
      email: 'carla@email.com',
      eventDate: nowDate(),
      eventType: 'Aniversario',
      notes: 'Cliente recorrente'
    }
  ]
  state.orders = [
    {
      id: 'o-1',
      clientId: 'c-1',
      serviceType: 'Convite digital',
      serviceValue: 350,
      paymentMethod: 'PIX',
      paymentStatus: '50% pago',
      orderStatus: 'Em criacao',
      startDate: nowDate(),
      dueDate: nowDate(),
      finalFileName: '',
      finalFileData: ''
    }
  ]
  saveData()
}

const isLateOrder = (order) => {
  const done = ['Finalizado', 'Entregue'].includes(order.orderStatus)
  return !done && order.dueDate && order.dueDate < nowDate()
}

const daysUntil = (dateStr) => {
  if (!dateStr) return 999
  const ms = new Date(dateStr).getTime() - new Date(nowDate()).getTime()
  return Math.ceil(ms / 86400000)
}

const paymentReceivedValue = (order) => {
  const value = Number(order.serviceValue || 0)
  if (order.paymentStatus === 'Pago') return value
  if (order.paymentStatus === '50% pago') return value * 0.5
  return 0
}

const monthlyRevenue = () => {
  const month = new Date().toISOString().slice(0, 7)
  return state.orders
    .filter((o) => (o.startDate || '').slice(0, 7) === month)
    .reduce((acc, o) => acc + paymentReceivedValue(o), 0)
}

const ordersByMonth = () => {
  const result = Array.from({ length: 12 }, (_, month) => ({ month, count: 0 }))
  state.orders.forEach((order) => {
    if (!order.startDate) return
    const m = new Date(order.startDate).getMonth()
    result[m].count += 1
  })
  return result
}

const getAlerts = () => {
  const dueSoon = state.orders.filter((o) => {
    const days = daysUntil(o.dueDate)
    return days >= 0 && days <= 2 && !['Finalizado', 'Entregue'].includes(o.orderStatus)
  })
  const pendingPayments = state.orders.filter((o) => o.paymentStatus !== 'Pago')
  const late = state.orders.filter(isLateOrder)
  return { dueSoon, pendingPayments, late }
}

const dashboardKPIs = () => {
  const activeOrders = state.orders.filter((o) => !['Finalizado', 'Entregue'].includes(o.orderStatus)).length
  const inProgress = state.orders.filter((o) => ['Em criacao', 'Em aprovacao'].includes(o.orderStatus)).length
  const completed = state.orders.filter((o) => ['Finalizado', 'Entregue'].includes(o.orderStatus)).length
  const pendingPayments = state.orders.filter((o) => o.paymentStatus !== 'Pago').length

  return {
    totalClients: state.clients.length,
    activeOrders,
    inProgress,
    completed,
    pendingPayments,
    monthlyRevenue: monthlyRevenue()
  }
}

const clientName = (clientId) => state.clients.find((c) => c.id === clientId)?.fullName || '-'

const renderLogin = () => {
  root.innerHTML = `
    <div class="login-screen">
      <div class="card login-card">
        <div class="section-head">
          <h2>Criarte Admin</h2>
          <button id="themeToggleLogin" class="btn secondary small" type="button"></button>
        </div>
        <p class="helper">Acesso ao painel administrativo protegido.</p>
        <form id="loginForm" class="list">
          <div>
            <label for="email">E-mail</label>
            <input id="email" class="input" type="email" required />
          </div>
          <div>
            <label for="password">Senha</label>
            <input id="password" class="input" type="password" required />
          </div>
          <button class="btn" type="submit">Entrar</button>
          <button id="forgotPass" class="btn secondary" type="button">Recuperar senha</button>
          <div id="loginError" class="helper"></div>
        </form>
      </div>
    </div>
  `

  const toggleLogin = document.getElementById('themeToggleLogin')
  toggleLogin.textContent = getTheme() === 'light' ? 'Tema preto' : 'Tema branco'
  toggleLogin.addEventListener('click', () => setTheme(getTheme() === 'light' ? 'dark' : 'light'))

  document.getElementById('forgotPass').addEventListener('click', () => {
    const email = prompt('Digite seu e-mail para recuperar a senha:')
    if (!email) return
    const user = state.users.find((u) => u.email === email)
    alert(user ? `Senha atual: ${user.password}` : 'E-mail nao encontrado.')
  })

  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault()
    const email = document.getElementById('email').value.trim().toLowerCase()
    const password = document.getElementById('password').value
    const user = state.users.find((u) => u.email.toLowerCase() === email && u.password === password)
    if (!user) {
      document.getElementById('loginError').textContent = 'Credenciais invalidas.'
      return
    }
    setSession(user.id)
    renderApp()
  })
}

const renderChart = () => {
  const canvas = document.getElementById('ordersChart')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const data = ordersByMonth()
  const max = Math.max(1, ...data.map((x) => x.count))
  const padding = 24
  const chartW = width - padding * 2
  const chartH = height - padding * 2
  const barW = chartW / 12 - 8

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-soft')
  ctx.font = '12px Poppins'

  data.forEach((item, index) => {
    const x = padding + index * (barW + 8)
    const h = (item.count / max) * (chartH - 20)
    const y = height - padding - h
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary')
    ctx.fillRect(x, y, barW, h)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-soft')
    ctx.fillText(String(item.count), x + barW / 2 - 4, y - 4)
    ctx.fillText(String(index + 1), x + barW / 2 - 3, height - 8)
  })
}

const renderDashboardSection = () => {
  const k = dashboardKPIs()
  const alerts = getAlerts()
  const nearDeliveries = state.orders
    .filter((o) => {
      const d = daysUntil(o.dueDate)
      return d >= 0 && d <= 7
    })
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 8)

  return `
    <section class="list">
      <div class="grid-6">
        <div class="card kpi"><h3>Total de clientes</h3><p>${k.totalClients}</p></div>
        <div class="card kpi"><h3>Pedidos ativos</h3><p>${k.activeOrders}</p></div>
        <div class="card kpi"><h3>Em andamento</h3><p>${k.inProgress}</p></div>
        <div class="card kpi"><h3>Concluidos</h3><p>${k.completed}</p></div>
        <div class="card kpi"><h3>Pagamentos pendentes</h3><p>${k.pendingPayments}</p></div>
        <div class="card kpi"><h3>Faturamento mensal</h3><p>${formatMoney(k.monthlyRevenue)}</p></div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-head"><h2>Pedidos por mes</h2></div>
          <canvas id="ordersChart"></canvas>
        </div>
        <div class="card">
          <div class="section-head"><h2>Entregas proximas</h2></div>
          <div class="list">
            ${nearDeliveries.length ? nearDeliveries.map((o) => `<div class="list-item"><strong>${clientName(o.clientId)}</strong><br/><small>${o.serviceType} - Prazo ${o.dueDate}</small></div>`).join('') : '<div class="list-item">Sem entregas para os proximos 7 dias.</div>'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-head"><h2>Alertas inteligentes</h2></div>
        <div class="list">
          <div class="alert warning">Prazos em ate 2 dias: ${alerts.dueSoon.length}</div>
          <div class="alert">Pagamentos pendentes: ${alerts.pendingPayments.length}</div>
          <div class="alert danger">Pedidos atrasados: ${alerts.late.length}</div>
        </div>
      </div>
    </section>
  `
}

const renderClientsSection = () => {
  const editing = state.clients.find((c) => c.id === state.editingClientId)

  return `
    <section class="list">
      <div class="card">
        <div class="section-head"><h2>${editing ? 'Editar cliente' : 'Cadastro de clientes'}</h2></div>
        <form id="clientForm" class="grid-2">
          <div>
            <label>Nome completo</label>
            <input class="input" name="fullName" value="${editing?.fullName || ''}" required />
          </div>
          <div>
            <label>Telefone</label>
            <input class="input" name="phone" value="${editing?.phone || ''}" required />
          </div>
          <div>
            <label>E-mail</label>
            <input class="input" type="email" name="email" value="${editing?.email || ''}" required />
          </div>
          <div>
            <label>Data do evento</label>
            <input class="input" type="date" name="eventDate" value="${editing?.eventDate || ''}" />
          </div>
          <div>
            <label>Tipo de evento</label>
            <select name="eventType">
              ${['Aniversario', 'Casamento', 'Cha Revelacao', 'Corporativo', 'Outro'].map((item) => `<option ${editing?.eventType === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Observacoes</label>
            <textarea name="notes">${editing?.notes || ''}</textarea>
          </div>
          <div class="row">
            <button class="btn" type="submit">${editing ? 'Salvar alteracoes' : 'Cadastrar cliente'}</button>
            ${editing ? '<button id="cancelClientEdit" type="button" class="btn secondary">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="card">
        <div class="section-head"><h2>Clientes cadastrados</h2></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Evento</th>
                <th>Observacoes</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              ${state.clients.map((c) => `
                <tr>
                  <td>${c.fullName}</td>
                  <td>${c.phone}<br/><small>${c.email}</small></td>
                  <td>${c.eventType}<br/><small>${c.eventDate || '-'}</small></td>
                  <td>${c.notes || '-'}</td>
                  <td>
                    <div class="row">
                      <a class="btn secondary small" href="https://wa.me/55${c.phone.replace(/\D/g, '')}" target="_blank" rel="noreferrer">WhatsApp</a>
                      <button class="btn secondary small" data-action="edit-client" data-id="${c.id}" type="button">Editar</button>
                      <button class="btn danger small" data-action="delete-client" data-id="${c.id}" type="button">Excluir</button>
                      <button class="btn secondary small" data-action="history-client" data-id="${c.id}" type="button">Historico</button>
                    </div>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
}

const renderOrdersSection = () => {
  const editing = state.orders.find((o) => o.id === state.editingOrderId)

  return `
    <section class="list">
      <div class="card">
        <div class="section-head"><h2>${editing ? 'Editar pedido' : 'Gestao de pedidos'}</h2></div>
        <form id="orderForm" class="grid-2">
          <div>
            <label>Cliente vinculado</label>
            <select name="clientId" required>
              <option value="">Selecione</option>
              ${state.clients.map((c) => `<option value="${c.id}" ${editing?.clientId === c.id ? 'selected' : ''}>${c.fullName}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Tipo de servico</label>
            <select name="serviceType" required>
              ${['Convite digital', 'Arte para Instagram', 'Arte personalizada', 'Logotipo', 'Identidade visual'].map((item) => `<option ${editing?.serviceType === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Valor do servico</label>
            <input class="input" type="number" step="0.01" min="0" name="serviceValue" value="${editing?.serviceValue || ''}" required />
          </div>
          <div>
            <label>Forma de pagamento</label>
            <select name="paymentMethod" required>
              ${['PIX', 'Cartao', 'Boleto', 'Dinheiro', 'Transferencia'].map((item) => `<option ${editing?.paymentMethod === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Status do pagamento</label>
            <select name="paymentStatus" required>
              ${['Pago', '50% pago', 'Pendente'].map((item) => `<option ${editing?.paymentStatus === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Status do pedido</label>
            <select name="orderStatus" required>
              ${['Aguardando pagamento', 'Em criacao', 'Em aprovacao', 'Finalizado', 'Entregue'].map((item) => `<option ${editing?.orderStatus === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Data de inicio</label>
            <input class="input" type="date" name="startDate" value="${editing?.startDate || nowDate()}" required />
          </div>
          <div>
            <label>Prazo de entrega</label>
            <input class="input" type="date" name="dueDate" value="${editing?.dueDate || ''}" required />
          </div>
          <div>
            <label>Upload arte final</label>
            <input class="input" type="file" name="finalFile" />
            ${editing?.finalFileName ? `<small>Arquivo atual: ${editing.finalFileName}</small>` : ''}
          </div>
          <div class="row">
            <button class="btn" type="submit">${editing ? 'Salvar pedido' : 'Cadastrar pedido'}</button>
            ${editing ? '<button id="cancelOrderEdit" type="button" class="btn secondary">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="card">
        <div class="section-head"><h2>Pedidos</h2></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servico</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Arquivo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              ${state.orders.map((o) => `
                <tr class="${isLateOrder(o) ? 'order-late' : ''}">
                  <td>${clientName(o.clientId)}</td>
                  <td>${o.serviceType}</td>
                  <td>${formatMoney(o.serviceValue)}</td>
                  <td>
                    <span class="badge ${o.paymentStatus === 'Pago' ? 'success' : o.paymentStatus === 'Pendente' ? 'danger' : 'warning'}">${o.paymentStatus}</span><br/>
                    <small>${o.paymentMethod}</small>
                  </td>
                  <td><span class="badge">${o.orderStatus}</span></td>
                  <td>${o.dueDate || '-'} ${isLateOrder(o) ? '<span class="badge danger">Atrasado</span>' : ''}</td>
                  <td>${o.finalFileName || '-'}</td>
                  <td>
                    <div class="row">
                      <button class="btn secondary small" data-action="edit-order" data-id="${o.id}" type="button">Editar</button>
                      <button class="btn danger small" data-action="delete-order" data-id="${o.id}" type="button">Excluir</button>
                    </div>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="8">Nenhum pedido cadastrado.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
}

const renderFinanceSection = () => `
  <section class="list">
    <div class="card">
      <div class="section-head"><h2>Controle financeiro</h2></div>
      <form id="financeFilter" class="row">
        <div>
          <label>De</label>
          <input type="date" class="input" name="start" />
        </div>
        <div>
          <label>Ate</label>
          <input type="date" class="input" name="end" />
        </div>
        <div class="row" style="margin-top:20px">
          <button type="submit" class="btn secondary">Filtrar</button>
          <button id="exportPdf" type="button" class="btn">Exportar PDF</button>
        </div>
      </form>
      <div id="financeResult" class="grid-2" style="margin-top:12px"></div>
    </div>
  </section>
`

const renderSection = () => {
  if (state.currentView === 'clients') return renderClientsSection()
  if (state.currentView === 'orders') return renderOrdersSection()
  if (state.currentView === 'finance') return renderFinanceSection()
  return renderDashboardSection()
}

const renderApp = () => {
  const session = getSession()
  if (!session) {
    renderLogin()
    return
  }

  const user = state.users.find((u) => u.id === session)
  if (!user) {
    clearSession()
    renderLogin()
    return
  }

  root.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="brand">Criarte <span>Admin</span></div>
        <nav class="nav">
          <button class="nav-btn ${state.currentView === 'dashboard' ? 'active' : ''}" data-nav="dashboard">Dashboard</button>
          <button class="nav-btn ${state.currentView === 'clients' ? 'active' : ''}" data-nav="clients">Clientes</button>
          <button class="nav-btn ${state.currentView === 'orders' ? 'active' : ''}" data-nav="orders">Pedidos</button>
          <button class="nav-btn ${state.currentView === 'finance' ? 'active' : ''}" data-nav="finance">Financeiro</button>
        </nav>
        <div class="sidebar-footer">
          <button id="themeToggle" class="btn secondary" type="button"></button>
          <button id="logoutBtn" class="btn danger" type="button">Sair</button>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="title">
            <h1>Painel Criarte - Convites e Artes Digitais</h1>
            <p>Bem-vindo(a), ${user.name}.</p>
          </div>
        </div>
        ${renderSection()}
      </main>
    </div>
  `

  setTheme(getTheme())

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.nav
      state.editingClientId = null
      state.editingOrderId = null
      renderApp()
    })
  })

  document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(getTheme() === 'light' ? 'dark' : 'light')
    renderChart()
  })

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession()
    renderLogin()
  })

  bindSectionEvents()
  renderChart()
}

const bindSectionEvents = () => {
  if (state.currentView === 'clients') bindClientEvents()
  if (state.currentView === 'orders') bindOrderEvents()
  if (state.currentView === 'finance') bindFinanceEvents()
}

const bindClientEvents = () => {
  const form = document.getElementById('clientForm')
  if (!form) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const payload = {
      fullName: String(data.get('fullName') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim(),
      eventDate: String(data.get('eventDate') || ''),
      eventType: String(data.get('eventType') || ''),
      notes: String(data.get('notes') || '').trim()
    }

    if (state.editingClientId) {
      state.clients = state.clients.map((c) => (c.id === state.editingClientId ? { ...c, ...payload } : c))
      state.editingClientId = null
    } else {
      state.clients.unshift({ id: id('c'), ...payload })
    }

    saveData()
    renderApp()
  })

  const cancel = document.getElementById('cancelClientEdit')
  if (cancel) {
    cancel.addEventListener('click', () => {
      state.editingClientId = null
      renderApp()
    })
  }

  document.querySelectorAll('[data-action="edit-client"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.editingClientId = btn.dataset.id
      renderApp()
    })
  })

  document.querySelectorAll('[data-action="delete-client"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Excluir cliente e pedidos vinculados?')) return
      const cid = btn.dataset.id
      state.clients = state.clients.filter((c) => c.id !== cid)
      state.orders = state.orders.filter((o) => o.clientId !== cid)
      saveData()
      renderApp()
    })
  })

  document.querySelectorAll('[data-action="history-client"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cid = btn.dataset.id
      const history = state.orders.filter((o) => o.clientId === cid)
      const message = history.length
        ? history.map((o) => `${o.serviceType} - ${o.orderStatus} - ${formatMoney(o.serviceValue)}`).join('\n')
        : 'Nenhum pedido para este cliente.'
      alert(message)
    })
  })
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve({ name: '', data: '' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, data: String(reader.result || '') })
    reader.onerror = () => resolve({ name: file.name, data: '' })
    reader.readAsDataURL(file)
  })

const bindOrderEvents = () => {
  const form = document.getElementById('orderForm')
  if (!form) return

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const file = data.get('finalFile')
    const parsedFile = await readFileAsDataUrl(file && file.size ? file : null)
    const base = state.editingOrderId ? state.orders.find((o) => o.id === state.editingOrderId) : null

    const payload = {
      clientId: String(data.get('clientId') || ''),
      serviceType: String(data.get('serviceType') || ''),
      serviceValue: Number(data.get('serviceValue') || 0),
      paymentMethod: String(data.get('paymentMethod') || ''),
      paymentStatus: String(data.get('paymentStatus') || ''),
      orderStatus: String(data.get('orderStatus') || ''),
      startDate: String(data.get('startDate') || ''),
      dueDate: String(data.get('dueDate') || ''),
      finalFileName: parsedFile.name || base?.finalFileName || '',
      finalFileData: parsedFile.data || base?.finalFileData || ''
    }

    if (state.editingOrderId) {
      state.orders = state.orders.map((o) => (o.id === state.editingOrderId ? { ...o, ...payload } : o))
      state.editingOrderId = null
    } else {
      state.orders.unshift({ id: id('o'), ...payload })
    }

    saveData()
    renderApp()
  })

  const cancel = document.getElementById('cancelOrderEdit')
  if (cancel) {
    cancel.addEventListener('click', () => {
      state.editingOrderId = null
      renderApp()
    })
  }

  document.querySelectorAll('[data-action="edit-order"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.editingOrderId = btn.dataset.id
      renderApp()
    })
  })

  document.querySelectorAll('[data-action="delete-order"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Excluir pedido?')) return
      const oid = btn.dataset.id
      state.orders = state.orders.filter((o) => o.id !== oid)
      saveData()
      renderApp()
    })
  })
}

const bindFinanceEvents = () => {
  const form = document.getElementById('financeFilter')
  const result = document.getElementById('financeResult')
  if (!form || !result) return

  const calculate = (start, end) => {
    const filtered = state.orders.filter((o) => {
      if (!o.startDate) return false
      if (start && o.startDate < start) return false
      if (end && o.startDate > end) return false
      return true
    })

    const totalReceived = filtered.reduce((acc, o) => acc + paymentReceivedValue(o), 0)
    const totalPending = filtered.reduce((acc, o) => acc + Number(o.serviceValue || 0) - paymentReceivedValue(o), 0)

    result.innerHTML = `
      <div class="card kpi"><h3>Total recebido</h3><p>${formatMoney(totalReceived)}</p></div>
      <div class="card kpi"><h3>Total pendente</h3><p>${formatMoney(totalPending)}</p></div>
      <div class="card" style="grid-column:1/-1">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Data</th><th>Servico</th><th>Recebido</th><th>Pendente</th></tr></thead>
            <tbody>
              ${filtered.map((o) => {
                const rec = paymentReceivedValue(o)
                return `<tr><td>${clientName(o.clientId)}</td><td>${o.startDate}</td><td>${o.serviceType}</td><td>${formatMoney(rec)}</td><td>${formatMoney(Number(o.serviceValue || 0) - rec)}</td></tr>`
              }).join('') || '<tr><td colspan="5">Sem dados no periodo.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `

    return { filtered, totalReceived, totalPending, start, end }
  }

  let latest = calculate('', '')

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    latest = calculate(String(data.get('start') || ''), String(data.get('end') || ''))
  })

  document.getElementById('exportPdf').addEventListener('click', () => {
    const html = `
      <html><head><title>Relatorio Financeiro</title>
      <style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}</style>
      </head><body>
      <h1>Relatorio Financeiro Criarte</h1>
      <p>Periodo: ${latest.start || 'Inicio'} ate ${latest.end || 'Hoje'}</p>
      <p>Total recebido: ${formatMoney(latest.totalReceived)}</p>
      <p>Total pendente: ${formatMoney(latest.totalPending)}</p>
      <table>
      <thead><tr><th>Cliente</th><th>Data</th><th>Servico</th><th>Valor</th><th>Pagamento</th></tr></thead>
      <tbody>
      ${latest.filtered.map((o) => `<tr><td>${clientName(o.clientId)}</td><td>${o.startDate}</td><td>${o.serviceType}</td><td>${formatMoney(o.serviceValue)}</td><td>${o.paymentStatus}</td></tr>`).join('')}
      </tbody></table>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `
    const popup = window.open('', '_blank')
    if (!popup) return
    popup.document.open()
    popup.document.write(html)
    popup.document.close()
  })
}

loadData()
setTheme(getTheme())
renderApp()
