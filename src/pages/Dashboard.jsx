import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProduct } from '../context/ProductContext';
import { 
  Package, TrendingUp, AlertCircle, CheckCircle, Calendar, 
  ArrowRight, QrCode, Users, MapPin, Building, DollarSign, 
  RefreshCw, ChevronRight, Activity, Shield, Wrench, FileText,
  Battery, Cpu, HardDrive, MemoryStick
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

// Chart Colors
const CHART_COLORS = {
  lightBlue: '#0ea5e9',
  green: '#10b981',
  amber: '#f59e0b',
  indigo: '#6366f1',
  rose: '#f43f5e',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#34d399'
};

const StatCard = ({ title, value, icon: Icon, color, colorLight, trend, loading }) => (
  <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden">
    {/* Animated background effect */}
    <div className={`absolute -inset-1 ${colorLight} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
    
    <div className="relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-rose-600'}`}>
              <TrendingUp size={12} />
              <span>{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProduct();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [assetValueTrend, setAssetValueTrend] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    if (products.length > 0) {
      calculateStats();
      prepareChartData();
      setChartLoading(false);
    }
  }, [products]);

  const calculateStats = () => {
    const totalProducts = products.length;
    const activeAssets = products.filter(p => p.status === 'Active').length;
    const maintenanceDue = products.filter(p => p.maintenance === 'Yes').length;
    const totalValue = products.reduce((sum, p) => sum + (parseInt(p.assetValue || p.cost || 0) || 0), 0);
    const avgValue = totalValue / totalProducts || 0;
    
    // Calculate warranty coverage
    const warrantyCovered = products.filter(p => p.warranty === 'Yes').length;
    const repairNeeded = products.filter(p => p.lastRepair && p.lastRepair !== '-').length;

    setStats([
      { 
        title: 'Total Products', 
        value: totalProducts, 
        icon: Package, 
        color: 'bg-light-blue-500', 
        colorLight: 'bg-light-blue-100',
        trend: 12 // Example trend - you can calculate from historical data
      },
      { 
        title: 'Active Assets', 
        value: activeAssets, 
        icon: CheckCircle, 
        color: 'bg-green-500', 
        colorLight: 'bg-green-100',
        trend: 8
      },
      { 
        title: 'Maintenance Due', 
        value: maintenanceDue, 
        icon: AlertCircle, 
        color: 'bg-amber-500', 
        colorLight: 'bg-amber-100',
        trend: -5
      },
      { 
        title: 'Total Value', 
        value: formatValue(totalValue), 
        icon: TrendingUp, 
        color: 'bg-indigo-500', 
        colorLight: 'bg-indigo-100',
        trend: 15
      },
      { 
        title: 'Avg. Asset Value', 
        value: formatValue(avgValue), 
        icon: DollarSign, 
        color: 'bg-purple-500', 
        colorLight: 'bg-purple-100'
      },
      { 
        title: 'Warranty Covered', 
        value: warrantyCovered, 
        icon: Shield, 
        color: 'bg-cyan-500', 
        colorLight: 'bg-cyan-100'
      }
    ]);
  };

  const prepareChartData = () => {
    // Category Distribution
    const categoryMap = {};
    products.forEach(p => {
      const category = p.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
      name: name.length > 12 ? name.substring(0, 10) + '...' : name,
      value,
      fullName: name
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Location Distribution
    const locationMap = {};
    products.forEach(p => {
      const location = p.location || 'Unknown';
      locationMap[location] = (locationMap[location] || 0) + 1;
    });
    const locationChartData = Object.entries(locationMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Status Distribution for Pie Chart
    const statusCount = {
      Active: products.filter(p => p.status === 'Active').length,
      Inactive: products.filter(p => p.status === 'Inactive').length,
      Repair: products.filter(p => p.status === 'Repair').length,
      Archived: products.filter(p => p.status === 'Archived').length
    };
    const statusChartData = Object.entries(statusCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    // Maintenance Status
    const maintenanceChartData = [
      { name: 'Required', value: products.filter(p => p.maintenance === 'Yes').length },
      { name: 'Not Required', value: products.filter(p => p.maintenance !== 'Yes').length }
    ];

    // Recent repairs data (simulated - replace with actual repair data)
    const simulatedRepairs = products
      .filter(p => p.lastRepair && p.lastRepair !== '-')
      .slice(-6)
      .map(p => ({
        name: p.productName?.substring(0, 15) + '...',
        cost: parseInt(p.lastCost || 0),
        date: p.lastRepair
      }));

    // Asset value trend (simulated monthly data)
    const trendData = [
      { month: 'Jan', value: 45000 },
      { month: 'Feb', value: 52000 },
      { month: 'Mar', value: 48000 },
      { month: 'Apr', value: 61000 },
      { month: 'May', value: 58000 },
      { month: 'Jun', value: 72000 },
    ];

    setCategoryData(categoryChartData);
    setLocationData(locationChartData);
    setStatusData(statusChartData);
    setMaintenanceData(maintenanceChartData);
    setRecentRepairs(simulatedRepairs);
    setAssetValueTrend(trendData);
  };

  const formatValue = (val) => {
    if (!val) return '₹0';
    const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
    if (numVal >= 10000000) return `₹${(numVal / 10000000).toFixed(1)}Cr`;
    if (numVal >= 100000) return `₹${(numVal / 100000).toFixed(1)}L`;
    if (numVal >= 1000) return `₹${(numVal / 1000).toFixed(1)}K`;
    return `₹${Math.round(numVal)}`;
  };

  const getTopProducts = (count = 5) => {
    return products
      .filter(p => p.assetValue || p.cost)
      .sort((a, b) => {
        const valA = parseInt(a.assetValue || a.cost || 0);
        const valB = parseInt(b.assetValue || b.cost || 0);
        return valB - valA;
      })
      .slice(0, count);
  };

  const getHighPriorityMaintenance = () => {
    return products
      .filter(p => p.maintenance === 'Yes' && p.priority === 'High')
      .slice(0, 5);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-600">
            {payload[0].dataKey === 'value' ? 'Count: ' : 'Value: '}
            <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (productsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-light-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4 lg:p-6 animate-fadeIn">
      {/* Header with User Info */}
      <div className="bg-gradient-to-r from-light-blue-500 via-cyan-500 to-light-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <span className="text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <p className="text-white/90 text-sm">Welcome back,</p>
              <h1 className="text-2xl md:text-3xl font-bold">{user?.name}</h1>
              <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                <Calendar size={14} />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          
         
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
        <div className="flex space-x-1">
          {['overview', 'analytics', 'maintenance', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-light-blue-50 text-light-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid - 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={chartLoading} />
        ))}
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Building size={20} className="text-light-blue-500" />
              Category Distribution
            </h3>
            <Link to="/products" className="text-light-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
              View Details <ChevronRight size={14} />
            </Link>
          </div>
          <div className="h-64">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill={CHART_COLORS.lightBlue}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Asset Status Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Activity size={20} className="text-green-500" />
              Asset Status
            </h3>
            <span className="text-xs text-slate-500">{products.length} Total Assets</span>
          </div>
          <div className="h-64">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    labelLine={false}
                    label={PieChartLabel}
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span className="text-xs text-slate-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Asset Value Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-500" />
              Asset Value Trend
            </h3>
            <span className="text-xs text-slate-500">Last 6 Months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={assetValueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatValue(value)}
                />
                <Tooltip 
                  formatter={(value) => [formatValue(value), 'Value']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS.indigo}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, fill: CHART_COLORS.indigo }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Wrench size={20} className="text-amber-500" />
              Maintenance Status
            </h3>
            <span className="text-xs text-slate-500">
              {maintenanceData[0]?.value || 0} Require Maintenance
            </span>
          </div>
          <div className="h-64">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maintenanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    labelLine={false}
                    label={PieChartLabel}
                  >
                    <Cell fill={CHART_COLORS.amber} />
                    <Cell fill={CHART_COLORS.green} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: Package, label: 'Add New Product', color: 'bg-light-blue-500', to: '/products/add' },
              { icon: QrCode, label: 'Generate QR Codes', color: 'bg-purple-500', to: '/products/qr' },
              { icon: FileText, label: 'Generate Report', color: 'bg-green-500', to: '/reports' },
              { icon: Users, label: 'Manage Users', color: 'bg-indigo-500', to: '/users' },
              { icon: MapPin, label: 'Location Audit', color: 'bg-amber-500', to: '/audit' },
            ].map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-300 group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon size={18} className="text-white" />
                </div>
                <span className="font-medium text-slate-700 flex-1">{action.label}</span>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* High Value Assets */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg">High Value Assets</h3>
            <Link to="/products" className="text-light-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {getTopProducts(4).map((product, index) => (
              <div 
                key={product.id || index}
                onClick={() => navigate(`/product/${product.id || product.sn}`)}
                className="p-4 rounded-xl border border-slate-100 hover:border-light-blue-200 hover:bg-light-blue-50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-light-blue-100 flex items-center justify-center">
                      <Package size={16} className="text-light-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm truncate max-w-[150px]">
                        {product.productName || 'Unnamed Product'}
                      </p>
                      <p className="text-xs text-slate-500">{product.category}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatValue(product.assetValue || product.cost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>SN: {product.sn}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    product.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Priority Maintenance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Priority Maintenance</h3>
            <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
              {getHighPriorityMaintenance().length} Urgent
            </span>
          </div>
          <div className="space-y-4">
            {getHighPriorityMaintenance().map((product, index) => (
              <div 
                key={product.id || index}
                className="p-4 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{product.productName}</p>
                    <p className="text-xs text-slate-500">Due for maintenance</p>
                  </div>
                  <AlertCircle size={18} className="text-amber-500" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Location: {product.location}</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                    HIGH
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-6">Recent Activities</h3>
        <div className="space-y-3">
          {products.slice(-5).reverse().map((product, index) => (
            <div 
              key={product.id || index}
              onClick={() => navigate(`/product/${product.id || product.sn}`)}
              className="p-4 rounded-xl border border-slate-100 hover:border-light-blue-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    product.status === 'Active' ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <Package size={20} className={
                      product.status === 'Active' ? 'text-green-600' : 'text-slate-600'
                    } />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{product.productName}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {product.sn}
                      </span>
                      <span>{product.brand}</span>
                      <span>•</span>
                      <span>{product.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {formatValue(product.assetValue || product.cost)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Added on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold mb-2">Inventory Summary</h4>
            <p className="text-slate-300 text-sm">
              {products.length} products across {new Set(products.map(p => p.location)).size} locations
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{products.filter(p => p.warranty === 'Yes').length}</p>
              <p className="text-xs text-slate-300">Under Warranty</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{products.filter(p => p.amc === 'Yes').length}</p>
              <p className="text-xs text-slate-300">AMC Covered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatValue(products.reduce((sum, p) => sum + (parseInt(p.totalCost || 0) || 0), 0))}
              </p>
              <p className="text-xs text-slate-300">Total Repair Cost</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;