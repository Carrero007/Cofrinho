// CONFIGURE A SENHA AQUI
        const SENHA_CORRETA = "GABI_E_PEDRO";
        
        // Sistema de autenticação
        function checkPassword() {
            const input = document.getElementById('passwordInput');
            const senha = input.value;
            
            if (senha === SENHA_CORRETA) {
                // Salva login no sessionStorage
                sessionStorage.setItem('authenticated', 'true');
                showApp();
            } else {
                // Mostra erro
                document.getElementById('loginError').classList.add('show');
                input.value = '';
                input.focus();
                
                // Remove erro após 3 segundos
                setTimeout(() => {
                    document.getElementById('loginError').classList.remove('show');
                }, 3000);
            }
        }

        function showApp() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').classList.add('active');
            loadData();
        }

        // Verifica se já está autenticado ao carregar a página
        window.addEventListener('DOMContentLoaded', () => {
            const isAuthenticated = sessionStorage.getItem('authenticated');
            if (isAuthenticated === 'true') {
                showApp();
            } else {
                // Foca no input de senha
                document.getElementById('passwordInput').focus();
            }
        });

        // Permite pressionar Enter para fazer login
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });

        // Resto do código do app
        let data = {
            person1: { name: 'Pedro', total: 0, history: [] },
            person2: { name: 'Gabi', total: 0, history: [] }
        };

        // Sistema de armazenamento usando arquivo JSON via API Claude
        async function loadData() {
            try {
                // Tenta carregar do localStorage primeiro (cache)
                const cached = localStorage.getItem('piggybank_cache');
                if (cached) {
                    data = JSON.parse(cached);
                    updateDisplay();
                }

                // Carrega do armazenamento permanente
                const result = await window.storage.get('piggybank_permanent', true);
                if (result && result.value) {
                    data = JSON.parse(result.value);
                    localStorage.setItem('piggybank_cache', result.value);
                }
            } catch (error) {
                console.log('Primeira vez usando o cofrinho ou erro ao carregar!');
            }
            updateDisplay();
        }

        async function saveData() {
            try {
                const jsonData = JSON.stringify(data);
                
                // Salva no localStorage como cache
                localStorage.setItem('piggybank_cache', jsonData);
                
                // Salva no armazenamento permanente compartilhado (sem verificação de erro)
                await window.storage.set('piggybank_permanent', jsonData, true).catch(() => {
                    // Ignora erro silenciosamente, pois o localStorage já salvou
                });
            } catch (error) {
                // Ignora erro silenciosamente
                console.log('Dados salvos no cache local');
            }
        }

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

        function addValue(person) {
            const input = document.getElementById(`${person}Input`);
            const value = parseFloat(input.value);

            if (isNaN(value) || value <= 0) {
                alert('Por favor, insira um valor válido!');
                return;
            }

            const entry = {
                id: Date.now() + Math.random(), // ID único para cada entrada
                value: value,
                date: new Date().toISOString()
            };

            data[person].history.push(entry);
            data[person].total += value;

            saveData(); // Removido o await
            updateDisplay();
            input.value = '';
            
            showSuccessFeedback(value);
        }

        function deleteEntry(person, entryId) {
            const entryIndex = data[person].history.findIndex(h => h.id === entryId);
            
            if (entryIndex === -1) return;

            const entry = data[person].history[entryIndex];
            
            if (confirm(`Tem certeza que deseja excluir o depósito de ${formatCurrency(entry.value)}?`)) {
                data[person].total -= entry.value;
                data[person].history.splice(entryIndex, 1);
                
                saveData(); // Removido o await
                updateDisplay();
                showDeleteFeedback(entry.value);
            }
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
                        <div class="history-amount">${formatCurrency(item.value)}</div>
                        <button class="delete-btn" onclick="deleteEntry('${item.person}', ${item.id})">🗑️ Excluir</button>
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