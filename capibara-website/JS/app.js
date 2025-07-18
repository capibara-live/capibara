// =============================================
// CAPIBARA APPLICATION LOGIC
// =============================================

// Global variables
let currentDateRange = 'last-week';
let currentBuildId = null;

// Date Range functionality
function toggleDateRange() {
    const selector = document.querySelector('.date-range-selector');
    selector.classList.toggle('active');
    
    // Close when clicking outside
    document.addEventListener('click', function closeDateRange(e) {
        if (!selector.contains(e.target)) {
            selector.classList.remove('active');
            document.removeEventListener('click', closeDateRange);
        }
    });
    
    event.stopPropagation();
}

function selectDateRange(range, label) {
    // Update selected range display
    document.getElementById('selected-range').textContent = label;
    
    // Update active state
    document.querySelectorAll('.date-range-option').forEach(option => {
        option.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Hide custom inputs
    document.getElementById('customDateInputs').style.display = 'none';
    
    // Close dropdown
    document.querySelector('.date-range-selector').classList.remove('active');
    
    // Update dashboard data based on selected range
    currentDateRange = range;
    console.log('Selected date range:', range);
    
    // If we have a current build, reload its data with new date range
    if (currentBuildId) {
        loadProductionMetricsForBuild(currentBuildId);
    }
}

function showCustomDateRange() {
    // Show custom date inputs
    document.getElementById('customDateInputs').style.display = 'flex';
    
    // Set default dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

function applyCustomDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        // Update display
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById('selected-range').textContent = `${start} - ${end}`;
        
        // Close dropdown
        document.querySelector('.date-range-selector').classList.remove('active');
        
        // Update dashboard
        currentDateRange = 'custom';
        console.log('Custom date range:', startDate, 'to', endDate);
        
        // If we have a current build, reload its data with new date range
        if (currentBuildId) {
            loadProductionMetricsForBuild(currentBuildId);
        }
    }
}

// Get date range for queries
function getDateRangeFilter() {
    const today = new Date();
    let startDate, endDate;
    
    switch (currentDateRange) {
        case 'last-day':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() - 1);
            break;
        case 'last-week':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            endDate = today;
            break;
        case 'whole-build':
            // This will be handled differently - we'll get all data
            return null;
        case 'custom':
            startDate = new Date(document.getElementById('startDate').value);
            endDate = new Date(document.getElementById('endDate').value);
            break;
        default:
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            endDate = today;
    }
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

// Builds dropdown functionality
function toggleBuildsDropdown() {
    const dropdown = document.getElementById('buildsDropdown');
    dropdown.classList.toggle('active');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeDropdown);
        }
    });
    
    // Prevent the document click from immediately closing the dropdown
    event.stopPropagation();
}

// Enhanced select build function
async function selectBuild(buildId) {
    console.log('🔄 Switching to build:', buildId);
    
    // Remove active class from all items
    document.querySelectorAll('.dropdown-build-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    event.currentTarget.classList.add('active');
    
    // Close the dropdown
    document.getElementById('buildsDropdown').classList.remove('active');
    
    // Store current build ID
    currentBuildId = buildId;
    
    // Fetch the selected build's data
    const { data: build, error } = await window.supabaseClient
        .from('builds')
        .select(`
            *,
            project:projects(name)
        `)
        .eq('id', buildId)
        .single();
    
    if (error) {
        console.error('Error loading build:', error);
        return;
    }
    
    console.log('📊 Selected build data:', build);
    
    // Update the page title
    document.querySelector('.content-title').textContent = build.name;
    
    // Update the dashboard cards with real data
    updateDashboardCards(build);
    
    // Load production metrics for this build
    loadProductionMetricsForBuild(buildId);
}

// Update dashboard cards
function updateDashboardCards(build) {
    // Update Daily I/O card
    const dailyIOValue = document.querySelector('.dashboard-card:nth-child(1) .metric-value');
    if (dailyIOValue) {
        dailyIOValue.textContent = build.actual_quantity.toLocaleString();
    }
    
    // Update Yield Rate card (calculate from actual vs target)
    const yieldValue = document.querySelector('.dashboard-card:nth-child(2) .metric-value');
    if (yieldValue && build.target_quantity > 0) {
        const yieldRate = ((build.actual_quantity / build.target_quantity) * 100).toFixed(1);
        yieldValue.textContent = yieldRate + '%';
    }
    
    // Update progress percentage
    const progressCards = document.querySelectorAll('.metric-label');
    progressCards.forEach(label => {
        if (label.textContent.includes('Complete')) {
            label.textContent = `${build.progress_percentage}% Complete`;
        }
    });
    
    // Update status indicators based on build status
    updateStatusIndicators(build.status);
}

// Update status indicators
function updateStatusIndicators(status) {
    const deltaHighlight = document.querySelector('.delta-highlight');
    
    if (status === 'on_track' || status === 'in_progress') {
        deltaHighlight.style.background = 'linear-gradient(135deg, rgba(0, 168, 107, 0.1), rgba(0, 216, 132, 0.05))';
        deltaHighlight.style.borderColor = 'rgba(0, 168, 107, 0.3)';
    } else if (status === 'at_risk') {
        deltaHighlight.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 217, 61, 0.05))';
        deltaHighlight.style.borderColor = 'rgba(255, 107, 107, 0.3)';
    } else if (status === 'delayed') {
        deltaHighlight.style.background = 'linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(255, 107, 149, 0.05))';
        deltaHighlight.style.borderColor = 'rgba(231, 76, 60, 0.3)';
    }
}

// Load production metrics
async function loadProductionMetricsForBuild(buildId) {
    console.log('📈 Loading production metrics for build:', buildId);
    
    // Get date range filter
    const dateFilter = getDateRangeFilter();
    
    // Build query
    let query = window.supabaseClient
        .from('production_metrics')
        .select('*')
        .eq('build_id', buildId)
        .order('production_date', { ascending: false });
    
    // Apply date filter if not "whole build"
    if (dateFilter) {
        query = query
            .gte('production_date', dateFilter.start)
            .lte('production_date', dateFilter.end);
    }
    
    // Limit results
    query = query.limit(30);
    
    const { data: metrics, error } = await query;
    
    if (error) {
        console.log('No production metrics yet for this build');
        return;
    }
    
    if (metrics && metrics.length > 0) {
        console.log('📊 Production metrics:', metrics);
        
        // Calculate totals
        const totalProduced = metrics.reduce((sum, m) => sum + (m.actual_quantity || 0), 0);
        const totalTarget = metrics.reduce((sum, m) => sum + (m.target_quantity || 0), 0);
        
        // Update the delta stats
        const deltaValue = totalProduced - totalTarget;
        const deltaPercent = totalTarget > 0 ? ((deltaValue / totalTarget) * 100).toFixed(1) : 0;
        
        // Update delta card values
        document.querySelector('.delta-stat:nth-child(1) .delta-value').textContent = deltaValue > 0 ? `+${deltaValue}` : deltaValue;
        document.querySelector('.delta-stat:nth-child(2) .delta-value').textContent = `${deltaPercent}%`;
        
        // Update sidebar stats with latest data
        if (metrics[0]) {
            const latestMetric = metrics[0];
            const yieldPercent = latestMetric.first_pass_yield || 94.2;
            document.querySelector('.stat-value').textContent = `${yieldPercent}%`;
        }
    }
}

// Tab switching functionality
function switchTab(tabName, clickedButton) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('Tab activated:', tabName);
    } else {
        console.error('Tab not found:', tabName + '-tab');
    }
    
    // Add active class to clicked button
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// Mock functions for buttons
function showExportModal() {
    alert('📊 Export functionality would open here');
}

function generateAISummary() {
    alert('🤖 AI Summary would be generated here');
}

// Test database connection
async function testDatabase() {
    console.log('🧪 Testing database connection...');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('builds')
            .select('count');
        
        if (error) {
            console.error('❌ Database error:', error.message);
        } else {
            console.log('✅ Database connected successfully!');
            console.log('📊 Query result:', data);
        }
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

// Load real builds from database
async function loadRealBuilds() {
    try {
        const { data: builds, error } = await window.supabaseClient
            .from('builds')
            .select(`
                *,
                project:projects(name)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        console.log('📊 Your builds:', builds);
        
        // If you have builds, update the UI
        if (builds && builds.length > 0) {
            updateBuildsDropdown(builds);
        }
    } catch (error) {
        console.error('Error loading builds:', error);
    }
}

// Update the builds dropdown with real data
function updateBuildsDropdown(builds) {
    const buildsList = document.querySelector('.dropdown-build-list');
    if (!buildsList) return;
    
    // Clear existing items
    buildsList.innerHTML = '';
    
    // Add real builds
    builds.forEach((build, index) => {
        const buildItem = document.createElement('div');
        buildItem.className = `dropdown-build-item ${index === 0 ? 'active' : ''}`;
        buildItem.onclick = () => selectBuild(build.id);
        
        // Format status for display
        const statusClass = `status-${build.status.replace('_', '-')}`;
        const statusText = build.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        buildItem.innerHTML = `
            <div class="build-name">${build.name}</div>
            <div class="build-status">
                <span>${build.priority} • ${build.progress_percentage}% Complete</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;
        
        buildsList.appendChild(buildItem);
    });
    
    // Update the count
    const countSpan = document.querySelector('.dropdown-header span');
    if (countSpan) {
        countSpan.textContent = `${builds.length} projects`;
    }
    
    // Automatically select the first build
    if (builds.length > 0) {
        currentBuildId = builds[0].id;
        updateDashboardCards(builds[0]);
        loadProductionMetricsForBuild(builds[0].id);
    }
}

// Add test data function (for development)
async function addTestData() {
    console.log('🏗️ Creating test data...');
    
    // First, create a project
    const { data: project, error: projectError } = await window.supabaseClient
        .from('projects')
        .insert({
            name: 'iPhone 16 Pro',
            code: 'IP16P',
            description: 'Next generation flagship smartphone',
            customer: 'Apple Inc.',
            product_type: 'Smartphone'
        })
        .select()
        .single();
    
    if (projectError) {
        console.error('Project error:', projectError);
        return;
    }
    
    console.log('✅ Project created:', project);
    
    // Now create builds
    const builds = [
        {
            project_id: project.id,
            name: 'iPhone 16 Pro DVT',
            code: 'IP16P-DVT-001',
            phase: 'DVT',
            status: 'in_progress',
            priority: 'P1',
            start_date: '2024-01-15',
            end_date: '2024-03-15',
            target_quantity: 10000,
            actual_quantity: 2847,
            progress_percentage: 28.47,
            factory_location: 'Shenzhen, China',
            factory_partner: 'Foxconn'
        },
        {
            project_id: project.id,
            name: 'MacBook Air M3',
            code: 'MBA-M3-EVT-001',
            phase: 'EVT',
            status: 'at_risk',
            priority: 'P2',
            start_date: '2024-02-01',
            end_date: '2024-04-30',
            target_quantity: 5000,
            actual_quantity: 1523,
            progress_percentage: 30.46,
            factory_location: 'Shanghai, China',
            factory_partner: 'Quanta'
        }
    ];
    
    const { data: newBuilds, error: buildsError } = await window.supabaseClient
        .from('builds')
        .insert(builds)
        .select();
    
    if (buildsError) {
        console.error('Builds error:', buildsError);
    } else {
        console.log('✅ Builds created:', newBuilds);
        // Reload the page to see the new data
        setTimeout(() => location.reload(), 1000);
    }
}

// Add production data for your builds
async function addProductionData() {
    console.log('📊 Adding production data...');
    
    // Get all builds
    const { data: builds } = await window.supabaseClient
        .from('builds')
        .select('id, name');
    
    if (!builds || builds.length === 0) {
        console.log('No builds found! Run addTestData() first.');
        return;
    }
    
    // Add production data for each build
    for (const build of builds) {
        const productionData = [];
        const today = new Date();
        
        // Create data for last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            productionData.push({
                build_id: build.id,
                production_date: date.toISOString().split('T')[0],
                shift: 'day',
                line: 'SMT_LINE_1',
                target_quantity: 500,
                actual_quantity: 450 + Math.floor(Math.random() * 100),
                good_quantity: 420 + Math.floor(Math.random() * 80),
                defect_quantity: 20 + Math.floor(Math.random() * 30),
                first_pass_yield: 88 + Math.random() * 10,
                overall_yield: 92 + Math.random() * 6,
                efficiency_percentage: 85 + Math.random() * 10
            });
        }
        
        const { error } = await window.supabaseClient
            .from('production_metrics')
            .insert(productionData);
        
        if (error) {
            console.error('Error adding production data:', error);
        } else {
            console.log(`✅ Added production data for ${build.name}`);
        }
    }
    
    console.log('🎉 Production data added! Refresh to see changes.');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Capibara platform loaded successfully');
    
    // Ensure dashboard tab is active by default
    const dashboardTab = document.getElementById('dashboard-tab');
    if (dashboardTab) {
        dashboardTab.classList.add('active');
    }
    
    // Initialize Supabase functions
    if (window.supabaseClient) {
        testDatabase();
        loadRealBuilds();
    } else {
        console.error('❌ Supabase client not initialized!');
    }
});

// Export functions for console access
window.addTestData = addTestData;
window.addProductionData = addProductionData;

console.log('💡 Quick commands:');
console.log('   addTestData()        - Add sample builds');
console.log('   addProductionData()  - Add production metrics');