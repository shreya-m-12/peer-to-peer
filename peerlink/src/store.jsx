import { createContext, useContext, useEffect, useState } from 'react'

const StoreContext = createContext(null)
const keys = {
  users: 'peerlink.users', items: 'peerlink.items', requests: 'peerlink.requests',
  transactions: 'peerlink.transactions', messages: 'peerlink.messages',
  notifications: 'peerlink.notifications', damageReports: 'peerlink.damageReports',
  agreements: 'peerlink.agreements', reviews: 'peerlink.reviews', session: 'peerlink.session',
}
const id = (prefix) => `${prefix}-${crypto.randomUUID()}`
const now = () => new Date().toISOString()
const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    const parsed = value ? JSON.parse(value) : fallback
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed
  } catch {
    return fallback
  }
}
const demoUsers = [
  { id: 'student-maya', fullName: 'Maya Rao', studentId: '4NM23CS041', email: 'maya@peerlink.edu', password: 'peerlink123', department: 'Computer Science', semester: '6', role: 'student' },
  { id: 'student-aryan', fullName: 'Aryan Shah', studentId: '4NM23EC018', email: 'aryan@peerlink.edu', password: 'peerlink123', department: 'Electronics', semester: '4', role: 'student' },
  { id: 'admin-demo', fullName: 'Campus Coordinator', studentId: 'STAFF-001', email: 'admin@peerlink.edu', password: 'peerlink123', department: 'Student Affairs', semester: '-', role: 'admin' },
]
const demoItems = [
  { id: 'item-calculator', ownerId: 'student-maya', name: 'Casio fx-991EX Calculator', category: 'Calculators', description: 'Scientific calculator, ideal for engineering coursework and exam practice.', image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=85', estimatedValue: 1000, condition: 'Good', existingDefects: 'Small scratch on the back cover; all buttons and display work.', quantity: 1, availableQuantity: 1, lendingDuration: 14, pickupLocation: 'Main library entrance', status: 'active', createdAt: now() },
  { id: 'item-textbook', ownerId: 'student-aryan', name: 'Engineering Mathematics II', category: 'Textbooks', description: 'Clean, annotated copy with worked examples and an intact cover.', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85', estimatedValue: 650, condition: 'Like New', existingDefects: 'Two highlighted sections in chapter 3.', quantity: 1, availableQuantity: 1, lendingDuration: 21, pickupLocation: 'Engineering block lobby', status: 'active', createdAt: now() },
  { id: 'item-kit', ownerId: 'student-maya', name: 'Arduino Starter Kit', category: 'Lab Equipment', description: 'Board, USB cable, jumper wires, and starter components for lab prototypes.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85', estimatedValue: 1800, condition: 'Good', existingDefects: 'One jumper wire has a bent pin; kit tested and working.', quantity: 1, availableQuantity: 1, lendingDuration: 10, pickupLocation: 'Innovation lab reception', status: 'active', createdAt: now() },
]

export function StoreProvider({ children }) {
  const [users, setUsers] = useState(() => read(keys.users, demoUsers))
  const [items, setItems] = useState(() => read(keys.items, demoItems))
  const [requests, setRequests] = useState(() => read(keys.requests, []))
  const [transactions, setTransactions] = useState(() => read(keys.transactions, []))
  const [messages, setMessages] = useState(() => read(keys.messages, []))
  const [notifications, setNotifications] = useState(() => read(keys.notifications, []))
  const [damageReports, setDamageReports] = useState(() => read(keys.damageReports, []))
  const [agreements, setAgreements] = useState(() => read(keys.agreements, []))
  const [reviews, setReviews] = useState(() => read(keys.reviews, []))
  const [userId, setUserId] = useState(() => read(keys.session, null))
  const user = users.find((person) => person.id === userId) ?? null

  useEffect(() => {
    try { Object.entries({ users, items, requests, transactions, messages, notifications, damageReports, agreements, reviews }).forEach(([name, value]) => localStorage.setItem(keys[name], JSON.stringify(value))) } catch { /* Storage can be unavailable in private browsing. */ }
  }, [users, items, requests, transactions, messages, notifications, damageReports, agreements, reviews])
  useEffect(() => { try { localStorage.setItem(keys.session, JSON.stringify(userId)) } catch { /* The in-memory session still works. */ } }, [userId])

  const notify = (to, title, detail, href) => setNotifications((current) => [{ id: id('notice'), userId: to, title, detail, href, readAt: null, createdAt: now() }, ...current])
  useEffect(() => {
    const dueNotices = []
    transactions.filter((entry) => entry.currentStatus === 'ACTIVE').forEach((transaction) => {
      const days = Math.ceil((new Date(transaction.dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
      if (days > 3) return
      const title = days < 0 ? 'Overdue item' : 'Return due soon'
      const itemName = items.find((item) => item.id === transaction.itemId)?.name ?? 'Borrowed item'
      ;[transaction.borrowerId, transaction.lenderId].forEach((personId) => {
        const sourceId = `${transaction.id}:${title}`
        if (!notifications.some((entry) => entry.userId === personId && entry.sourceId === sourceId)) dueNotices.push({ id: id('notice'), userId: personId, sourceId, title, detail: `${itemName} is ${days < 0 ? `${Math.abs(days)} day(s) overdue` : days === 0 ? 'due today' : `due in ${days} day(s)`}.`, href: '/borrowings', readAt: null, createdAt: now() })
      })
    })
    if (dueNotices.length) setNotifications((current) => {
      const unique = dueNotices.filter((notice) => !current.some((entry) => entry.userId === notice.userId && entry.sourceId === notice.sourceId))
      return unique.length ? [...unique, ...current] : current
    })
  }, [transactions, items, notifications])
  const audit = (method, collection, record) => {
    const recordPath = ['PUT', 'DELETE'].includes(method) && record?.id ? `/${record.id}` : ''
    fetch(`/api/${collection}${recordPath}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'DELETE' ? undefined : JSON.stringify(record) }).catch(() => {})
  }
  const login = (email, password) => {
    const match = users.find((person) => person.email.toLowerCase() === email.toLowerCase() && person.password === password)
    if (!match) throw new Error('Email or password is not correct.')
    setUserId(match.id)
    return match
  }
  const register = (form) => {
    if (users.some((person) => person.email.toLowerCase() === form.email.trim().toLowerCase() || person.studentId.toLowerCase() === form.studentId.trim().toLowerCase())) throw new Error('An account already uses that email or student ID.')
    const person = { ...form, id: id('student'), email: form.email.trim().toLowerCase(), role: 'student' }
    setUsers((current) => [...current, person]); setUserId(person.id)
    return person
  }
  const logout = () => setUserId(null)
  const saveItem = (form, existingId) => {
    if (!user || user.role !== 'student') throw new Error('Sign in as a student to manage listings.')
    const previous = items.find((item) => item.id === existingId)
    if (previous && previous.ownerId !== user.id) throw new Error('Only the owner can edit this listing.')
    const record = { ...form, estimatedValue: Number(form.estimatedValue), quantity: Number(form.quantity), availableQuantity: previous ? Math.min(previous.availableQuantity, Number(form.quantity)) : Number(form.quantity), lendingDuration: Number(form.lendingDuration), id: previous?.id ?? id('item'), ownerId: user.id, status: previous?.status ?? 'active', createdAt: previous?.createdAt ?? now() }
    setItems((current) => previous ? current.map((item) => item.id === record.id ? record : item) : [record, ...current]); audit(previous ? 'PUT' : 'POST', 'items', record)
    return record
  }
  const removeItem = (itemId) => {
    const item = items.find((entry) => entry.id === itemId)
    if (!item || item.ownerId !== user?.id) throw new Error('Only the owner can remove this listing.')
    if (transactions.some((loan) => loan.itemId === itemId && !['COMPLETED'].includes(loan.currentStatus))) throw new Error('This item has an open lending record and cannot be removed.')
    setItems((current) => current.filter((entry) => entry.id !== itemId)); audit('DELETE', 'items', item)
  }
  const toggleItem = (itemId) => setItems((current) => current.map((item) => item.id === itemId && item.ownerId === user?.id ? { ...item, status: item.status === 'active' ? 'paused' : 'active' } : item))
  const createRequest = (itemId, form) => {
    const item = items.find((entry) => entry.id === itemId)
    if (!item || item.status !== 'active' || item.availableQuantity < 1) throw new Error('This resource is currently unavailable.')
    if (item.ownerId === user?.id) throw new Error('You cannot request your own resource.')
    const start = new Date(form.requestedStartDate); const due = new Date(form.requestedDueDate)
    if (!form.requestedStartDate || !form.requestedDueDate || Number.isNaN(start.getTime()) || Number.isNaN(due.getTime()) || due <= start || start < new Date(new Date().toDateString())) throw new Error('Choose a valid future start date and a later due date.')
    if (Math.ceil((due - start) / 86400000) > Number(item.lendingDuration)) throw new Error(`This item can be borrowed for up to ${item.lendingDuration} days.`)
    const collision = requests.some((entry) => entry.itemId === itemId && ['PENDING', 'APPROVED'].includes(entry.status) && new Date(entry.requestedStartDate) <= due && new Date(entry.requestedDueDate) >= start)
    if (collision) throw new Error('Those dates overlap an existing request.')
    const request = { ...form, id: id('request'), itemId, borrowerId: user.id, ownerId: item.ownerId, status: 'PENDING', createdAt: now() }
    setRequests((current) => [request, ...current]); audit('POST', 'requests', request); notify(item.ownerId, 'New borrow request', `${user.fullName} requested ${item.name}.`, '/requests')
    return request
  }
  const decideRequest = (requestId, approve, response = '') => {
    const request = requests.find((entry) => entry.id === requestId)
    if (!request || request.ownerId !== user?.id || request.status !== 'PENDING') throw new Error('This request can no longer be updated.')
    const nextStatus = approve ? 'APPROVED' : 'REJECTED'
    setRequests((current) => current.map((entry) => entry.id === requestId ? { ...entry, status: nextStatus, lenderResponse: response } : entry))
    audit('PUT', 'requests', { ...request, status: nextStatus, lenderResponse: response })
    notify(request.borrowerId, approve ? 'Request approved' : 'Request declined', `${items.find((item) => item.id === request.itemId)?.name ?? 'Your request'} was ${approve ? 'approved' : 'declined'}.`, '/borrowings')
    if (approve) {
      const transaction = { id: id('loan'), requestId, itemId: request.itemId, lenderId: request.ownerId, borrowerId: request.borrowerId, dueDate: request.requestedDueDate, handover: { lenderConfirmedAt: null, borrowerConfirmedAt: null, lenderCondition: '', borrowerCondition: '' }, return: { borrowerReportedAt: null, lenderConfirmedAt: null, borrowerCondition: '', lenderCondition: '' }, currentStatus: 'HANDOVER_PENDING', createdAt: now() }
      setTransactions((current) => [transaction, ...current]); audit('POST', 'transactions', transaction)
    }
  }
  const cancelRequest = (requestId) => {
    const request = requests.find((entry) => entry.id === requestId)
    if (!request || request.borrowerId !== user?.id || request.status !== 'PENDING') throw new Error('Only your pending request can be cancelled.')
    const cancelled = { ...request, status: 'CANCELLED' }
    setRequests((current) => current.map((entry) => entry.id === requestId ? cancelled : entry)); audit('PUT', 'requests', cancelled); notify(request.ownerId, 'Request cancelled', 'A pending borrowing request was cancelled.', '/requests')
  }
  const patchTransaction = (transactionId, patch) => {
    const transaction = transactions.find((entry) => entry.id === transactionId)
    if (!transaction || ![transaction.lenderId, transaction.borrowerId].includes(user?.id)) throw new Error('You are not a participant in this transaction.')
    const next = { ...transaction, ...patch }
    setTransactions((current) => current.map((entry) => entry.id === transactionId ? next : entry)); audit('PUT', 'transactions', next)
    return next
  }
  const confirmHandover = (transactionId, condition) => {
    const transaction = transactions.find((entry) => entry.id === transactionId)
    if (!condition?.trim()) throw new Error('Record the inspected item condition before confirming handover.')
    const handover = { ...transaction.handover }
    if (user.id === transaction.lenderId) { handover.lenderConfirmedAt = now(); handover.lenderCondition = condition.trim() }
    else if (user.id === transaction.borrowerId) { handover.borrowerConfirmedAt = now(); handover.borrowerCondition = condition.trim() }
    else throw new Error('You are not part of this transaction.')
    const complete = handover.lenderConfirmedAt && handover.borrowerConfirmedAt
    const next = patchTransaction(transactionId, { handover, currentStatus: complete ? 'ACTIVE' : 'HANDOVER_PENDING' })
    if (complete) setItems((current) => current.map((item) => item.id === transaction.itemId ? { ...item, availableQuantity: Math.max(0, item.availableQuantity - 1) } : item))
    else notify(user.id === transaction.lenderId ? transaction.borrowerId : transaction.lenderId, 'Handover confirmation needed', 'Your lending partner confirmed the handover. Please inspect and confirm receipt.', '/borrowings')
    return next
  }
  const reportReturn = (transactionId, condition) => {
    const transaction = transactions.find((entry) => entry.id === transactionId)
    if (user.id !== transaction.borrowerId || transaction.currentStatus !== 'ACTIVE') throw new Error('Only the borrower can report an active loan as returned.')
    if (!condition?.trim()) throw new Error('Record the returned item condition before submitting the return.')
    const next = patchTransaction(transactionId, { return: { ...transaction.return, borrowerReportedAt: now(), borrowerCondition: condition.trim() }, currentStatus: 'RETURN_PENDING_VERIFICATION' })
    notify(transaction.lenderId, 'Return reported', 'The borrower says the item has been physically returned. Please inspect and confirm.', '/returns')
    return next
  }
  const confirmReturn = (transactionId, condition) => {
    const transaction = transactions.find((entry) => entry.id === transactionId)
    if (user.id !== transaction.lenderId || !transaction.return.borrowerReportedAt) throw new Error('The borrower must report the physical return first.')
    if (!condition?.trim()) throw new Error('Record the inspected return condition before confirming receipt.')
    const result = patchTransaction(transactionId, { return: { ...transaction.return, lenderConfirmedAt: now(), lenderCondition: condition.trim() }, currentStatus: 'COMPLETED' })
    const hasOpenCase = damageReports.some((report) => report.transactionId === transactionId && !['RESOLVED', 'INCONCLUSIVE'].includes(report.status))
    if (!hasOpenCase) setItems((current) => current.map((item) => item.id === transaction.itemId ? { ...item, availableQuantity: Math.min(item.quantity, item.availableQuantity + 1) } : item))
    setRequests((current) => current.map((request) => request.id === transaction.requestId ? { ...request, status: 'COMPLETED' } : request))
    notify(transaction.borrowerId, 'Return confirmed', 'The lender verified the returned item. This lending record is complete.', '/returns')
    return result
  }
  const createDamageReport = (transactionId, form) => {
    const transaction = transactions.find((entry) => entry.id === transactionId)
    if (!transaction || ![transaction.lenderId, transaction.borrowerId].includes(user?.id)) throw new Error('Only transaction participants can report damage.')
    if (!form.description.trim() || !form.beforeEvidence.trim() || !form.afterEvidence.trim()) throw new Error('Describe the damage and provide before and after evidence links or notes.')
    const report = { ...form, id: id('damage'), transactionId, itemId: transaction.itemId, reportedBy: user.id, estimatedRepairCost: Number(form.estimatedRepairCost || 0), borrowerResponse: null, status: 'BORROWER_RESPONSE_PENDING', createdAt: now() }
    setDamageReports((current) => [report, ...current]); audit('POST', 'damage-reports', report)
    notify(transaction.borrowerId, 'Damage report submitted', 'Review the report and share your response before a resolution is proposed.', '/returns')
    return report
  }
  const respondToDamage = (reportId, response, disputed, evidence = '') => {
    const report = damageReports.find((entry) => entry.id === reportId)
    const transaction = transactions.find((entry) => entry.id === report?.transactionId)
    if (!transaction || transaction.borrowerId !== user?.id || !response.trim()) throw new Error('Enter a response to this damage report.')
    setDamageReports((current) => current.map((entry) => entry.id === reportId ? { ...entry, borrowerResponse: { text: response, createdAt: now(), evidence }, status: disputed ? 'DISPUTED' : 'UNDER_REVIEW' } : entry))
    notify(transaction.lenderId, 'Borrower response received', 'The borrower responded to a damage report.', '/returns')
  }
  const proposeRecovery = (reportId, form) => {
    const report = damageReports.find((entry) => entry.id === reportId)
    const transaction = transactions.find((entry) => entry.id === report?.transactionId)
    if (!transaction || ![transaction.lenderId, transaction.borrowerId].includes(user?.id)) throw new Error('Only transaction participants can propose a resolution.')
    if (form.method === 'DIRECT_AMOUNT' && !(Number(form.proposedAmount) > 0)) throw new Error('Enter the mutually agreed recovery amount. Payment happens directly between students.')
    const previous = agreements.find((entry) => entry.damageReportId === reportId)
    const agreement = { ...(previous ?? {}), ...form, id: previous?.id ?? id('agreement'), damageReportId: reportId, proposedBy: user.id, lenderConfirmation: previous?.lenderConfirmation ?? false, borrowerConfirmation: previous?.borrowerConfirmation ?? false, status: 'AWAITING_MUTUAL_CONFIRMATION', updatedAt: now() }
    setAgreements((current) => previous ? current.map((entry) => entry.id === agreement.id ? agreement : entry) : [agreement, ...current])
    setDamageReports((current) => current.map((entry) => entry.id === reportId ? { ...entry, status: 'RESOLUTION_PROPOSED' } : entry))
    notify(user.id === transaction.lenderId ? transaction.borrowerId : transaction.lenderId, 'Recovery proposal', 'Your lending partner proposed a way to resolve the damage report.', '/returns')
  }
  const confirmRecovery = (agreementId) => {
    const agreement = agreements.find((entry) => entry.id === agreementId)
    const report = damageReports.find((entry) => entry.id === agreement?.damageReportId)
    const transaction = transactions.find((entry) => entry.id === report?.transactionId)
    const next = { ...agreement, lenderConfirmation: agreement.lenderConfirmation || user.id === transaction.lenderId, borrowerConfirmation: agreement.borrowerConfirmation || user.id === transaction.borrowerId, updatedAt: now() }
    if (next.lenderConfirmation && next.borrowerConfirmation) {
      next.status = 'RESOLVED'; next.resolvedAt = now()
      setDamageReports((current) => current.map((entry) => entry.id === report.id ? { ...entry, status: 'RESOLVED' } : entry))
      if (transaction.currentStatus === 'COMPLETED' && !damageReports.some((entry) => entry.transactionId === transaction.id && entry.id !== report.id && !['RESOLVED', 'INCONCLUSIVE'].includes(entry.status))) {
        setItems((current) => current.map((item) => item.id === transaction.itemId ? { ...item, availableQuantity: Math.min(item.quantity, item.availableQuantity + 1) } : item))
      }
    }
    setAgreements((current) => current.map((entry) => entry.id === agreementId ? next : entry))
  }
  const reviewDamage = (reportId, decision, explanation) => {
    if (user?.role !== 'admin') throw new Error('Admin access is required.')
    if (!explanation.trim()) throw new Error('Add review notes before recording an outcome.')
    const review = { id: id('review'), damageReportId: reportId, reviewerId: user.id, decision, explanation, reviewedAt: now(), acknowledgedBy: [] }
    const closesCase = ['PRE_EXISTING_DAMAGE', 'NORMAL_WEAR_AND_TEAR', 'NOT_ESTABLISHED'].includes(decision)
    const status = decision === 'INCONCLUSIVE' ? 'INCONCLUSIVE' : closesCase ? 'RESOLVED' : 'UNDER_REVIEW'
    const report = damageReports.find((entry) => entry.id === reportId)
    const transaction = transactions.find((entry) => entry.id === report?.transactionId)
    setReviews((current) => [review, ...current]); setDamageReports((current) => current.map((entry) => entry.id === reportId ? { ...entry, status, adminDecision: decision } : entry))
    if (closesCase && transaction?.currentStatus === 'COMPLETED' && !damageReports.some((entry) => entry.transactionId === transaction.id && entry.id !== reportId && !['RESOLVED', 'INCONCLUSIVE'].includes(entry.status))) {
      setItems((current) => current.map((item) => item.id === transaction.itemId ? { ...item, availableQuantity: Math.min(item.quantity, item.availableQuantity + 1) } : item))
    }
    if (transaction) { notify(transaction.lenderId, 'Dispute reviewed', 'A coordinator recorded a review outcome for your case.', '/returns'); notify(transaction.borrowerId, 'Dispute reviewed', 'A coordinator recorded a review outcome for your case.', '/returns') }
  }
  const sendMessage = (transactionId, content) => {
    const transaction = transactions.find((entry) => entry.id === transactionId)
    if (!transaction || ![transaction.lenderId, transaction.borrowerId].includes(user?.id) || !content.trim()) throw new Error('A message needs a valid transaction and text.')
    const message = { id: id('message'), conversationId: transactionId, transactionId, senderId: user.id, receiverId: user.id === transaction.lenderId ? transaction.borrowerId : transaction.lenderId, content: content.trim(), createdAt: now(), readAt: null }
    setMessages((current) => [...current, message]); notify(message.receiverId, 'New message', `${user.fullName} sent you a message.`, '/messages')
  }
  const markConversationRead = (transactionId) => setMessages((current) => {
    let changed = false
    const updated = current.map((entry) => {
      if (entry.transactionId !== transactionId || entry.receiverId !== user?.id || entry.readAt) return entry
      changed = true
      return { ...entry, readAt: now() }
    })
    return changed ? updated : current
  })
  const markRead = (notificationId) => setNotifications((current) => current.map((entry) => entry.id === notificationId && entry.userId === user?.id ? { ...entry, readAt: now() } : entry))
  const markAllRead = () => setNotifications((current) => current.map((entry) => entry.userId === user?.id ? { ...entry, readAt: entry.readAt ?? now() } : entry))
  const value = { users, items, requests, transactions, messages, notifications, damageReports, agreements, reviews, user, login, register, logout, saveItem, removeItem, toggleItem, createRequest, decideRequest, cancelRequest, confirmHandover, reportReturn, confirmReturn, createDamageReport, respondToDamage, proposeRecovery, confirmRecovery, reviewDamage, sendMessage, markConversationRead, markRead, markAllRead }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider.')
  return store
}
