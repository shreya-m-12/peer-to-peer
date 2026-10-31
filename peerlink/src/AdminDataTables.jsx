import { CalendarDays, Users } from 'lucide-react'

const dateText = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'

export default function AdminDataTables({ users, items, transactions }) {
  return <>
    <section className="panel table-panel">
      <div className="panel-heading"><div><h2>Registered demo users</h2><p>Private account fields are visible to the authorised coordinator only.</p></div><Users size={18} /></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Student ID</th><th>Department</th><th>Role</th></tr></thead><tbody>
        {users.map((user) => <tr key={user.id}><td>{user.fullName}</td><td>{user.studentId}</td><td>{user.department}</td><td>{user.role}</td></tr>)}
      </tbody></table></div>
    </section>
    <section className="panel table-panel">
      <div className="panel-heading"><div><h2>Transaction ledger</h2><p>Every approved request, handover, and return record.</p></div><CalendarDays size={18} /></div>
      {transactions.length ? <div className="table-wrap"><table><thead><tr><th>Record</th><th>Resource</th><th>Lender</th><th>Borrower</th><th>Due</th><th>Status</th></tr></thead><tbody>
        {transactions.map((transaction) => <tr key={transaction.id}><td>{transaction.id.slice(0, 15)}</td><td>{items.find((item) => item.id === transaction.itemId)?.name ?? 'Removed resource'}</td><td>{users.find((user) => user.id === transaction.lenderId)?.fullName ?? 'Student'}</td><td>{users.find((user) => user.id === transaction.borrowerId)?.fullName ?? 'Student'}</td><td>{dateText(transaction.dueDate)}</td><td><span className={`status status-${transaction.currentStatus.toLowerCase().replaceAll('_', '-')}`}>{transaction.currentStatus.replaceAll('_', ' ')}</span></td></tr>)}
      </tbody></table></div> : <p className="form-hint">No transactions have been recorded yet.</p>}
    </section>
  </>
}
