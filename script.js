// ============================================
        // CONFIGURAÇÃO - MUDE AQUI A URL DA SUA API
        // ============================================
        const API_URL = 'https://api.jsonbin.io/v3/b/691d1b4fd0ea881f40f127f7';
        const API_KEY = '$2a$10$dVCsZ8kBw6znrqEZB9tuc.cgV1LErI3N4OegnOWyVyBDO03ZAzIDC'; 
        const SENHA_CORRETA = "GABI_E_PEDRO";

        // ============================================
        // SISTEMA DE AUTENTICAÇÃO
        // ============================================
        
        function checkPassword() {
            const input = document.getElementById('passwordInput');
            const senha = input.value;
            
            if (senha === SENHA_CORRETA) {
                sessionStorage.setItem('authenticated', 'true');
                showApp();
            } else {
                document.getElementById('loginError').classList.add('show');
                input.value = '';
                input.focus();
                
                setTimeout(() => {
                    document.getElementById('loginError').classList.remove('show');
                }, 3000);
            }
        }

        function logout() {
            if (confirm('Deseja realmente sair?')) {
                sessionStorage.removeItem('authenticated');
                document.getElementById('appScreen').classList.remove('active');
                document.getElementById('loginScreen').style.display = 'flex';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').focus();
            }
        }

        function showApp() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').classList.add('active');
            loadData();
        }

        window.addEventListener('DOMContentLoaded', () => {
            const isAuthenticated = sessionStorage.getItem('authenticated');
            if (isAuthenticated === 'true') {
                showApp();
            } else {
                document.getElementById('passwordInput').focus();
            }
        });

        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });

        // ============================================
        // SISTEMA DE BANCO DE DADOS
        // ============================================

        let data = {
            person1: { name: 'Pedro', total: 0, history: [] },
            person2: { name: 'Gabi', total: 0, history: [] }
        };

        let isOnline = false;

        async function loadData() {
            try {
                // Tenta carregar do localStorage primeiro (cache)
                const cached = localStorage.getItem('cofrinho_cache');
                if (cached) {
                    data = JSON.parse(cached);
                    updateDisplay();
                }

                // Tenta carregar do banco de dados online
                const response = await fetch(API_URL + '/latest', {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': API_KEY
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    data = result.record;
                    localStorage.setItem('cofrinho_cache', JSON.stringify(data));
                    isOnline = true;
                    updateDBStatus('online');
                } else {
                    isOnline = false;
                    updateDBStatus('offline');
                }
            } catch (error) {
                console.log('Usando dados locais');
                isOnline = false;
                updateDBStatus('offline');
            }
            updateDisplay();
        }

        async function saveData() {
            // Salva no localStorage imediatamente
            localStorage.setItem('cofrinho_cache', JSON.stringify(data));

            // Tenta salvar online
            try {
                const response = await fetch(API_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_KEY
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    isOnline = true;
                    updateDBStatus('online');
                } else {
                    isOnline = false;
                    updateDBStatus('offline');
                }
            } catch (error) {
                isOnline = false;
                updateDBStatus('offline');
            }
        }

        function updateDBStatus(status) {
            const statusEl = document.getElementById('dbStatus');
            if (status === 'online') {
                statusEl.className = 'db-status online';
                statusEl.textContent = '✓ Conectado - Dados sincronizados';
            } else {
                statusEl.className = 'db-status offline';
                statusEl.textContent = '⚠ Modo offline - Dados salvos localmente';
            }
        }

        // ============================================
        // FUNÇÕES DO APP
        // ============================================

        function formatCurrency(value) {
            return `R$ ${value.toFixed(2).replace('.', ',')}`;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        async function addValue(person) {
            const input = document.getElementById(`${person}Input`);
            const btn = document.getElementById(person === 'person1' ? 'addBtn1' : 'addBtn2');
            const value = parseFloat(input.value);

            if (isNaN(value) || value <= 0) {
                showErrorFeedback('Por favor, insira um valor válido!');
                return;
            }

            // Desabilita botão durante salvamento
            btn.disabled = true;

            const entry = {
                id: Date.now() + Math.random(),
                value: value,
                date: new Date().toISOString()
            };

            data[person].history.push(entry);
            data[person].total += value;

            await saveData();
            updateDisplay();
            input.value = '';
            btn.disabled = false;
            
            showSuccessFeedback(value);
        }

        async function deleteEntry(person, entryId) {
            if (!confirm('Tem certeza que deseja excluir este depósito?')) {
                return;
            }

            const entryIndex = data[person].history.findIndex(h => h.id === entryId);
            if (entryIndex === -1) return;

            const entry = data[person].history[entryIndex];
            
            data[person].total -= entry.value;
            data[person].history.splice(entryIndex, 1);
            
            await saveData();
            updateDisplay();
            showDeleteFeedback(entry.value);
        }

        function showSuccessFeedback(value) {
            const feedback = document.createElement('div');
            feedback.className = 'success-feedback';
            feedback.textContent = `✓ ${formatCurrency(value)} adicionado!`;
            document.body.appendChild(feedback);
            
            setTimeout(() => feedback.classList.add('show'), 10);
            setTimeout(() => {
                feedback.classList.remove('show');
                setTimeout(() => feedback.remove(), 300);
            }, 2000);
        }

        function showDeleteFeedback(value) {
            const feedback = document.createElement('div');
            feedback.className = 'delete-feedback';
            feedback.textContent = `✓ ${formatCurrency(value)} removido!`;
            document.body.appendChild(feedback);
            
            setTimeout(() => feedback.classList.add('show'), 10);
            setTimeout(() => {
                feedback.classList.remove('show');
                setTimeout(() => feedback.remove(), 300);
            }, 2000);
        }

        function showErrorFeedback(message) {
            const feedback = document.createElement('div');
            feedback.className = 'error-feedback';
            feedback.textContent = `❌ ${message}`;
            document.body.appendChild(feedback);
            
            setTimeout(() => feedback.classList.add('show'), 10);
            setTimeout(() => {
                feedback.classList.remove('show');
                setTimeout(() => feedback.remove(), 300);
            }, 3000);
        }

        function updateDisplay() {
            const total = data.person1.total + data.person2.total;
            document.getElementById('totalAmount').textContent = formatCurrency(total);
            document.getElementById('person1Total').textContent = formatCurrency(data.person1.total);
            document.getElementById('person2Total').textContent = formatCurrency(data.person2.total);

            const allHistory = [
                ...data.person1.history.map(h => ({ ...h, person: 'person1', name: data.person1.name })),
                ...data.person2.history.map(h => ({ ...h, person: 'person2', name: data.person2.name }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            document.getElementById('historyCount').textContent = 
                `${allHistory.length} ${allHistory.length === 1 ? 'depósito' : 'depósitos'}`;

            const historyList = document.getElementById('historyList');
            
            if (allHistory.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <div class="empty-icon">🐷</div>
                        <div>Nenhum depósito ainda.<br>Comece a economizar!</div>
                    </div>
                `;
            } else {
                historyList.innerHTML = allHistory.map(item => `
                    <div class="history-item">
                        <div class="history-info">
                            <div class="history-person">${item.name}</div>
                            <div class="history-date">${formatDate(item.date)}</div>
                        </div>
                        <div class="history-right">
                            <div class="history-amount">${formatCurrency(item.value)}</div>
                            <button class="delete-btn" onclick="deleteEntry('${item.person}', ${item.id})">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        document.getElementById('person1Input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addValue('person1');
        });

        document.getElementById('person2Input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addValue('person2');
        });

        // Atualiza dados a cada 3000 segundos
        setInterval(loadData, 3000000);