import { useEffect, useMemo, useState } from 'react'
import './index.css'

function uid() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const initialSort = 'created_desc'

export default function App() {
	const [tasks, setTasks] = useState([])
	const [title, setTitle] = useState('')
	const [due, setDue] = useState('')
	const [priority, setPriority] = useState('medium')
	const [filter, setFilter] = useState('all')
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState(initialSort)

	useEffect(() => {
		try {
			const raw = localStorage.getItem('todo-react:data')
			if (!raw) return
			const data = JSON.parse(raw)
			if (Array.isArray(data.tasks)) setTasks(data.tasks)
			if (data.sort) setSort(data.sort)
		} catch {}
	}, [])

	useEffect(() => {
		localStorage.setItem('todo-react:data', JSON.stringify({ tasks, sort }))
	}, [tasks, sort])

	const addTask = (e) => {
		e.preventDefault()
		const t = title.trim()
		if (!t) return
		const newTask = { id: uid(), title: t, completed: false, createdAt: Date.now(), due: due || null, priority, order: tasks.length + 1 }
		setTasks((prev) => [newTask, ...prev])
		setTitle('')
		setDue('')
		setPriority('medium')
	}

	const toggle = (id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
	const remove = (id) => setTasks((prev) => prev.filter((t) => t.id !== id))
	const updateTitle = (id, next) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: next || t.title } : t)))
	const clearCompleted = () => setTasks((prev) => prev.filter((t) => !t.completed))

	const priorityRank = (p) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1)

	const view = useMemo(() => {
		let v = [...tasks]
		if (filter === 'active') v = v.filter((t) => !t.completed)
		if (filter === 'completed') v = v.filter((t) => t.completed)
		if (search) {
			const q = search.toLowerCase()
			v = v.filter((t) => t.title.toLowerCase().includes(q))
		}
		v.sort((a, b) => {
			switch (sort) {
				case 'created_asc':
					return a.createdAt - b.createdAt
				case 'created_desc':
					return b.createdAt - a.createdAt
				case 'due_asc':
					return (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31')
				case 'due_desc':
					return (b.due || '0000-01-01').localeCompare(a.due || '0000-01-01')
				case 'priority_desc':
					return priorityRank(b.priority) - priorityRank(a.priority)
				case 'priority_asc':
					return priorityRank(a.priority) - priorityRank(b.priority)
				default:
					return a.order - b.order
			}
		})
		return v
	}, [tasks, filter, search, sort])

	const total = tasks.length
	const completed = tasks.filter((t) => t.completed).length
	const remaining = total - completed

	return (
		<div className="app">
			<header className="app-header">
				<h1>To‑Do Pro</h1>
			</header>

			<section className="composer" aria-labelledby="add-task-heading">
				<h2 id="add-task-heading" className="sr-only">Add a new task</h2>
				<form className="composer-form" onSubmit={addTask}>
					<input className="text" placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} required />
					<input className="date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
					<select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
						<option value="medium">Priority: Medium</option>
						<option value="high">Priority: High</option>
						<option value="low">Priority: Low</option>
					</select>
					<button className="button primary" type="submit">Add Task</button>
				</form>
			</section>

			<section className="toolbar" aria-label="Task tools">
				<div className="filters" role="group" aria-label="Filters">
					<button className={`chip${filter==='all'?' active':''}`} onClick={() => setFilter('all')} aria-pressed={filter==='all'}>All</button>
					<button className={`chip${filter==='active'?' active':''}`} onClick={() => setFilter('active')} aria-pressed={filter==='active'}>Active</button>
					<button className={`chip${filter==='completed'?' active':''}`} onClick={() => setFilter('completed')} aria-pressed={filter==='completed'}>Completed</button>
				</div>
				<input className="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
				<select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
					<option value="created_desc">Newest</option>
					<option value="created_asc">Oldest</option>
					<option value="due_asc">Due date ↑</option>
					<option value="due_desc">Due date ↓</option>
					<option value="priority_desc">Priority High → Low</option>
					<option value="priority_asc">Priority Low → High</option>
				</select>
			</section>

			<section className="list-section" aria-labelledby="tasks-heading">
				<h2 id="tasks-heading" className="sr-only">Tasks</h2>
				<ul className="task-list">
					{view.map((t) => (
						<li key={t.id} className="task-item">
							<label className="checkbox">
								<input type="checkbox" checked={t.completed} onChange={() => toggle(t.id)} />
								<span className="title-wrap">
									<input
										className="title-input"
										value={t.title}
										onChange={(e) => updateTitle(t.id, e.target.value)}
									/>
									<span className="meta">
										{t.due ? new Date(t.due + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
										{t.priority ? ` · ${t.priority}` : ''}
									</span>
								</span>
							</label>
							<button className="button danger" onClick={() => remove(t.id)}>Delete</button>
						</li>
					))}
				</ul>
			</section>

			<footer className="footer-bar" aria-label="Summary and actions">
				<div className="summary">{remaining} remaining • {completed} completed • {total} total</div>
				<div className="footer-actions">
					<button className="button" onClick={clearCompleted}>Clear completed</button>
				</div>
			</footer>
		</div>
	)
}
