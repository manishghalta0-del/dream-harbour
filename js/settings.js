        document.addEventListener('DOMContentLoaded', async function() {
            if (!checkSession()) return;
            document.getElementById('userName').textContent = 'Welcome, ' + currentUser.name;
            await loadAllData();
        });
        
        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        async function loadAllData() {
            try {
                const { data: services } = await supabase.from('service_types').select('*');
                const { data: customers } = await supabase.from('customers').select('*');
                
                const serviceTable = document.getElementById('serviceTable').querySelector('tbody');
                serviceTable.innerHTML = (services || []).map(service => `
                    <tr>
                        <td>${service.service_name}</td>
                        <td>${service.category || '-'}</td>
                        <td>${service.sac_code}</td>
                        <td>${service.gst_percentage}%</td>
                        <td>₹${service.base_rate}</td>
                        <td>${service.is_active ? 'Active' : 'Inactive'}</td>
                        <td>-</td>
                    </tr>
                `).join('');
                
                const customerTable = document.getElementById('customerTable').querySelector('tbody');
                customerTable.innerHTML = (customers || []).map(customer => `
                    <tr>
                        <td>${customer.full_name}</td>
                        <td>${customer.mobile_no}</td>
                        <td>${customer.email || '-'}</td>
                        <td>${customer.gstin || '-'}</td>
                    </tr>
                `).join('');
                
                document.getElementById('serviceStat').textContent = `📊 Total: ${services?.length || 0} | Active: ${services?.filter(s => s.is_active).length || 0}`;
                document.getElementById('customerStat').textContent = `📊 Total Customers: ${customers?.length || 0}`;
                
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
   