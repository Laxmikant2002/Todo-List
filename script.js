const STORAGE_KEY = 'todos'

// Helpers
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function parseDateISO(s){return s ? new Date(s+'T00:00:00') : null}
function formatDateISO(d){ if(!d) return ''; const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${dd}/${mm}/${yyyy}` }
function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}

// Load & Save
function loadTodos(){
	try{
		const raw = localStorage.getItem(STORAGE_KEY)
		if(!raw) return null
		return JSON.parse(raw)
	}catch(e){console.error('Failed to load todos',e);return []}
}
function saveTodos(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

function seedDemo(){
	const today = new Date()
	const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+2)
	const yesterday = new Date(today); yesterday.setDate(today.getDate()-2)
	const demo = [
		{id:uid(), name:'AccioJob Assignment', date: today.toISOString().slice(0,10), priority:'High', completed:false},
		{id:uid(), name:'AccioJob Assignment 2', date: today.toISOString().slice(0,10), priority:'Medium', completed:false},
		{id:uid(), name:'AccioJob Assignment 3', date: tomorrow.toISOString().slice(0,10), priority:'High', completed:false},
		{id:uid(), name:'AccioJob Assignment 4', date: new Date(tomorrow.getTime()+2*24*60*60*1000).toISOString().slice(0,10), priority:'Medium', completed:false},
		{id:uid(), name:'AccioJob Assignment 0', date: yesterday.toISOString().slice(0,10), priority:'High', completed:true},
		{id:uid(), name:'AccioJob Assignment 1', date: yesterday.toISOString().slice(0,10), priority:'Low', completed:true}
	]
	saveTodos(demo)
	return demo
}

// Render
function renderTodos(){
	const raw = loadTodos()
	const todos = raw === null ? seedDemo() : raw

	const todayList = document.getElementById('today-list')
	const futureList = document.getElementById('future-list')
	const completedList = document.getElementById('completed-list')

	todayList.innerHTML=''
	futureList.innerHTML=''
	completedList.innerHTML=''

	const now = startOfDay(new Date())

	todos.forEach(todo => {
		const d = parseDateISO(todo.date)
		const isCompleted = !!todo.completed

		const li = document.createElement('li')
		li.className = 'todo-item'
		if(isCompleted) li.classList.add('completed-item')
		li.dataset.id = todo.id

		const left = document.createElement('div'); left.className = 'todo-left'
		const numberEl = document.createElement('div'); numberEl.className = 'item-number'
		const name = document.createElement('div'); name.className = 'todo-name'; name.textContent = todo.name
		const meta = document.createElement('div'); meta.className = 'todo-meta'; meta.textContent = formatDateISO(d) + ' • Priority: ' + todo.priority
		// numberEl will be populated with the correct index when we decide which list to append to
		left.appendChild(numberEl)
		left.appendChild(name); left.appendChild(meta)

		const right = document.createElement('div'); right.className = 'todo-right'

		// Complete toggle
			const completeBtn = document.createElement('button')
			completeBtn.className = 'btn complete'
			completeBtn.title = isCompleted ? 'Mark as not completed' : 'Mark as completed'
			completeBtn.dataset.action = 'toggle'
			// SVG icons (check / undo)
			completeBtn.innerHTML = isCompleted ?
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.71"/><polyline points="1 1 5 5"/></svg>' :
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'

		// Delete
		const delBtn = document.createElement('button')
		delBtn.className = 'btn delete'
		delBtn.title = 'Delete item'
		delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'
		delBtn.dataset.action = 'delete'

		right.appendChild(completeBtn)
		right.appendChild(delBtn)

		li.appendChild(left)
		li.appendChild(right)

			// Decide which list and set numbering
			if(isCompleted){
				const idx = completedList.children.length + 1
				numberEl.textContent = idx + '.'
				completedList.appendChild(li)
			} else if(d && startOfDay(d).getTime() === now.getTime()){
				const idx = todayList.children.length + 1
				numberEl.textContent = idx + '.'
				todayList.appendChild(li)
			} else {
				const idx = futureList.children.length + 1
				numberEl.textContent = idx + '.'
				futureList.appendChild(li)
			}
	})

	// Attach delegation handlers
	[todayList, futureList, completedList].forEach(listEl => {
		listEl.onclick = (e) => {
			const btn = e.target.closest('button')
			if(!btn) return
			const action = btn.dataset.action
			const li = btn.closest('li')
			if(!li) return
			const id = li.dataset.id
			if(action === 'delete') return deleteTodo(id)
			if(action === 'toggle') return toggleComplete(id)
		}
	})
}

// Actions
function addTodo(name,date,priority){
	const list = loadTodos() || []
	list.push({id:uid(), name, date, priority, completed:false})
	saveTodos(list)
	renderTodos()
}

function deleteTodo(id){
	let list = loadTodos() || []
	list = list.filter(t => t.id !== id)
	saveTodos(list)
	renderTodos()
}

function toggleComplete(id){
	const list = loadTodos() || []
	const idx = list.findIndex(t => t.id === id)
	if(idx === -1) return
	list[idx].completed = !list[idx].completed
	saveTodos(list)
	renderTodos()
}

// Wire form
document.addEventListener('DOMContentLoaded',()=>{
	const form = document.getElementById('add-form')
	const nameInput = document.getElementById('item-name')
	const dateInput = document.getElementById('item-date')
	const priorityInput = document.getElementById('item-priority')

	// default date to today
	const todayISO = new Date().toISOString().slice(0,10)
	dateInput.value = todayISO

	form.addEventListener('submit', (e)=>{
		e.preventDefault()
		const name = nameInput.value.trim()
		const date = dateInput.value
		const priority = priorityInput.value
		if(!name) return
		addTodo(name,date,priority)
		form.reset()
		dateInput.value = todayISO
	})

	renderTodos()
})

