let servicesData = [];
let selectedServices = [];
let allCustomers = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadServices();
    await loadCustomers();
    await loadInvoiceList();
    setupEventListeners();
});

async function loadServices() {
    try {
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('is_active', true);
        
        if (error) {
            console.error('Error loading services:', error);
            return;
        }
        
        servicesData = data || [];
        populateServiceDropdown();
        
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

function populateServiceDropdown() {
    const serviceSelect = document.getElementById('serviceType');
    if (!serviceSelect) return;
    
    serviceSelect.innerHTML = '<option value="">-- Select Service --</option>';
    
    servicesData.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.service_name;
        option.dataset.sac = service.sac_code;
        option.dataset.gst = service.gst_percentage;
        option.dataset.rate = service.base_rate;
        option.dataset.hasGovtFee = service.has_government_fee;
        option.dataset.govtFeeAmount = service.government_fee_amount || 0;
        serviceSelect.appendChild(option);
    });
}

async function loadCustomers() {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading customers:', error);
            return;
        }
        
        allCustomers = data || [];
        
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function lookupCustomer(phoneNumber) {
    try {
        const found = allCustomers.find(c => c.mobile_no === phoneNumber);
        if (found) {
            return found;
        }
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('mobile_no', phoneNumber)
            .single();
        
        if (error) {
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('Error looking up customer:', error);
        return null;
    }
}

async function loadInvoiceList() {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select(`*,customers (full_name)`)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('Error loading invoices:', error);
            return;
        }
        
        displayInvoiceList(data || []);
        
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

function displayInvoiceList(invoices) {
    const invoiceList = document.getElementById('invoiceList');
    if (!invoiceList) return;
    
    if (invoices.length === 0) {
        invoiceList.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No invoices found</td></tr>';
        return;
    }
    
    invoiceList.innerHTML = invoices.map(invoice => `
        <tr>
            <td>${invoice.invoice_number}</td>
            <td>${formatDate(invoice.invoice_date)}</td>
            <td>${invoice.customers?.full_name || 'N/A'}</td>
            <td>${formatCurrency(invoice.total_amount)}</td>
            <td><span style="background-color: ${invoice.payment_status === 'Paid' ? '#28a745' : '#ffc107'}; color: white; padding: 5px 10px; border-radius: 3px;">${invoice.payment_status}</span></td>
            <td>
                <button onclick="viewInvoice('${invoice.id}')" style="padding: 5px 10px; margin: 2px;">View</button>
                <button onclick="deleteInvoice('${invoice.id}')" style="padding: 5px 10px; margin: 2px;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function onServiceChange() {
    const serviceSelect = document.getElementById('serviceType');
    if (!serviceSelect) return;
    
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    if (!selectedOption.value) {
        document.getElementById('serviceRate').value = '';
        return;
    }
    
    const rate = selectedOption.dataset.rate;
    const rateInput = document.getElementById('serviceRate');
    
    if (rate && rate !== 'null') {
        rateInput.value = rate;
        rateInput.disabled = true;
    } else {
        rateInput.value = '';
        rateInput.disabled = false;
    }
}

async function onCustomerMobileBlur() {
    const mobileInput = document.getElementById('customerMobile');
    const phone = mobileInput.value.trim();
    
    if (!phone) return;
    
    if (!validatePhoneNumber(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    const customer = await lookupCustomer(phone);
    
    if (customer) {
        document.getElementById('customerName').value = customer.full_name;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerGSTIN').value = customer.gstin || '';
        document.getElementById('customerAddress').value = customer.address || '';
        alert('✓ Customer found!');
    } else {
        document.getElementById('customerName').value = '';
        document.getElementById('customerEmail').value = '';
        document.getElementById('customerGSTIN').value = '';
        document.getElementById('customerAddress').value = '';
        alert('New customer - please enter details');
    }
}

function addService() {
    const serviceSelect = document.getElementById('serviceType');
    const quantityInput = document.getElementById('quantity');
    const rateInput = document.getElementById('serviceRate');
    
    if (!serviceSelect.value) {
        alert('Please select a service');
        return;
    }
    
    const quantity = parseInt(quantityInput.value) || 0;
    if (quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    const rate = parseFloat(rateInput.value) || 0;
    if (rate <= 0) {
        alert('Please enter a valid rate');
        return;
    }
    
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceId = serviceSelect.value;
    const serviceName = selectedOption.textContent;
    const sacCode = selectedOption.dataset.sac;
    const gstPercentage = parseFloat(selectedOption.dataset.gst) || 18;
    const hasGovtFee = selectedOption.dataset.hasGovtFee === 'true';
    const govtFeeAmount = parseFloat(selectedOption.dataset.govtFeeAmount) || 0;
    
    const serviceAmount = quantity * rate;
    const gstAmount = calculateGST(serviceAmount, gstPercentage);
    const totalAmount = calculateTotal(serviceAmount, gstPercentage);
    
    const lineItem = {
        id: Date.now(),
        serviceId: serviceId,
        serviceName: serviceName,
        sacCode: sacCode,
        quantity: quantity,
        rate: rate,
        amount: serviceAmount,
        gstPercentage: gstPercentage,
        gstAmount: gstAmount,
        total: totalAmount,
        hasGovtFee: hasGovtFee,
        govtFeeAmount: govtFeeAmount
    };
    
    selectedServices.push(lineItem);
    
    if (hasGovtFee && govtFeeAmount > 0) {
        const govtFeeItem = {
            id: Date.now() + 1,
            serviceId: serviceId + '_govt_fee',
            serviceName: `${serviceName} - Government Fee`,
            sacCode: sacCode,
            quantity: quantity,
            rate: govtFeeAmount,
            amount: govtFeeAmount * quantity,
            gstPercentage: 0,
            gstAmount: 0,
            total: govtFeeAmount * quantity,
            hasGovtFee: false
        };
        selectedServices.push(govtFeeItem);
    }
    
    displaySelectedServices();
    serviceSelect.value = '';
    quantityInput.value = '1';
    rateInput.value = '';
    rateInput.disabled = false;
}

function displaySelectedServices() {
    const table = document.getElementById('selectedServicesTable');
    if (!table) return;
    
    if (selectedServices.length === 0) {
        table.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No services added yet</td></tr>';
        updateInvoiceTotals();
        return;
    }
    
    table.innerHTML = selectedServices.map((item, index) => `
        <tr>
            <td>${item.serviceName}</td>
            <td>${item.sacCode}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.rate)}</td>
            <td>${formatCurrency(item.amount)}</td>
            <td>${item.gstPercentage}%</td>
            <td>${formatCurrency(item.gstAmount)}</td>
            <td>${formatCurrency(item.total)}</td>
            <td><button onclick="removeService(${item.id})" style="padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">Remove</button></td>
        </tr>
    `).join('');
    
    updateInvoiceTotals();
}

function removeService(id) {
    selectedServices = selectedServices.filter(item => item.id !== id);
    displaySelectedServices();
}

function updateInvoiceTotals() {
    let subtotal = 0;
    let totalGST = 0;
    
    selectedServices.forEach(item => {
        subtotal += item.amount;
        totalGST += item.gstAmount;
    });
    
    const total = subtotal + totalGST;
    
    const subtotalDisplay = document.getElementById('invoiceSubtotal');
    const gstDisplay = document.getElementById('invoiceGST');
    const totalDisplay = document.getElementById('invoiceTotal');
    
    if (subtotalDisplay) subtotalDisplay.textContent = formatCurrency(subtotal);
    if (gstDisplay) gstDisplay.textContent = formatCurrency(totalGST);
    if (totalDisplay) totalDisplay.textContent = formatCurrency(total);
}

async function submitInvoice() {
    const phone = document.getElementById('customerMobile').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    
    if (!phone || !customerName) {
        alert('Please enter customer details');
        return;
    }
    
    if (!validatePhoneNumber(phone)) {
        alert('Please enter a valid phone number');
        return;
    }
    
    if (selectedServices.length === 0) {
        alert('Please add at least one service');
        return;
    }
    
    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked')?.value || 'Pending';
    const paymentType = document.getElementById('paymentType').value || 'Cash';
    
    try {
        let customerId;
        let customer = await lookupCustomer(phone);
        
        if (!customer) {
            const { data, error } = await supabase
                .from('customers')
                .insert([{
                    mobile_no: phone,
                    full_name: customerName,
                    email: document.getElementById('customerEmail').value || null,
                    gstin: document.getElementById('customerGSTIN').value || null,
                    address: document.getElementById('customerAddress').value || null
                }])
                .select();
            
            if (error) {
                console.error('Error creating customer:', error);
                alert('Error creating customer');
                return;
            }
            
            customerId = data[0].id;
        } else {
            customerId = customer.id;
        }
        
        let subtotal = 0;
        let totalGST = 0;
        selectedServices.forEach(item => {
            subtotal += item.amount;
            totalGST += item.gstAmount;
        });
        const totalAmount = subtotal + totalGST;
        
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert([{
                invoice_number: `INV-${Date.now()}`,
                customer_id: customerId,
                created_by: currentUser.id,
                invoice_date: new Date().toISOString(),
                subtotal: subtotal,
                total_gst: totalGST,
                total_amount: totalAmount,
                payment_status: paymentStatus
            }])
            .select();
        
        if (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            alert('Error creating invoice');
            return;
        }
        
        const invoiceId = invoiceData[0].id;
        
        const invoiceItems = selectedServices.map(item => ({
            invoice_id: invoiceId,
            description: item.serviceName,
            sac_code: item.sacCode,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            gst_percentage: item.gstPercentage,
            gst_amount: item.gstAmount
        }));
        
        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems);
        
        if (itemsError) {
            console.error('Error creating invoice items:', itemsError);
            alert('Error creating invoice items');
            return;
        }
        
        alert('✓ Invoice created successfully!');
        resetInvoiceForm();
        await loadInvoiceList();
        
    } catch (error) {
        console.error('Error submitting invoice:', error);
        alert('Error creating invoice. Please try again.');
    }
}

function resetInvoiceForm() {
    const form = document.getElementById('invoiceForm');
    if (form) form.reset();
    selectedServices = [];
    displaySelectedServices();
    document.getElementById('serviceType').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('serviceRate').value = '';
}

function setupEventListeners() {
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', onServiceChange);
    }
    
    const mobileInput = document.getElementById('customerMobile');
    if (mobileInput) {
        mobileInput.addEventListener('blur', onCustomerMobileBlur);
    }
    
    const addBtn = document.getElementById('addServiceBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addService);
    }
    
    const submitBtn = document.getElementById('submitInvoiceBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitInvoice);
    }
    
    const resetBtn = document.getElementById('resetFormBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetInvoiceForm);
    }
}

function viewInvoice(id) {
    alert('View invoice: ' + id);
}

function deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        alert('Delete invoice: ' + id);
    }
}