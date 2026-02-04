import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Eye, EyeOff, Plus, Edit2, Loader2, 
  RefreshCw, Save, X, Check, Trash2, 
  Download, Lock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Add user form state
    const [addForm, setAddForm] = useState({
        name: '',
        id: '',
        password: '',
        role: 'User',
        systemId: '',
        status: 'Active'
    });

    const apiUrl = "https://script.google.com/macros/s/AKfycbyzZ_KxsII2w95PsqH3JprWCCiQRehkRTrnNQmQWVWYX8vosFClyTtTSawjAUPzDs9a/exec";
    const sheetName = "USER";

    // Fetch users from Google Sheet
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiUrl}?sheet=${sheetName}`);
            const result = await response.json();

            if (result.success && result.data) {
                const rows = result.data;
                const dataRows = rows.slice(1); // Remove header row

                // Map users from sheet data - ADJUSTED TO MATCH YOUR SHEET STRUCTURE
                const mappedUsers = dataRows.map((row, index) => ({
                    rowIndex: index + 2, // 1-indexed, +1 for header
                    name: row[0] || '',      // User Name (A)
                    id: row[1] || '',        // ID (B)
                    password: row[2] || '',  // Password (C)
                    role: row[3] || 'User',  // Role (D)
                    systemId: row[4] || '',  // System ID (E)
                    status: row[5] || 'Active', // Status (F)
                    timestamp: row[6] || ''  // Timestamp (G)
                })).filter(u => u.id && u.id.trim() !== ''); // Filter out empty rows

                setUsers(mappedUsers);
            } else {
                setError('Failed to load users data');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Update a cell in the sheet
    const updateCell = async (rowIndex, columnIndex, value) => {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: new URLSearchParams({
                action: "updateCell",
                sheetName: sheetName,
                rowIndex: rowIndex.toString(),
                columnIndex: columnIndex.toString(),
                value: value
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error("Update failed");
        }

        return true;
    };

    // Update a user in the table (inline edit)
    const handleUpdateUser = async (userToUpdate) => {
        setSaving(true);
        setError('');
        try {
            const rowIndex = userToUpdate.rowIndex;

            // Update each field in the sheet
            await updateCell(rowIndex, 1, userToUpdate.name);        // Column A: User Name
            await updateCell(rowIndex, 2, userToUpdate.id);          // Column B: ID
            await updateCell(rowIndex, 3, userToUpdate.password);    // Column C: Password
            await updateCell(rowIndex, 4, userToUpdate.role);        // Column D: Role
            await updateCell(rowIndex, 5, userToUpdate.systemId);    // Column E: System ID
            await updateCell(rowIndex, 6, userToUpdate.status);      // Column F: Status

            setEditingUserId(null);
            setSuccessMessage('User updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            
            // Refresh the data
            await fetchData();
        } catch (err) {
            console.error('Error updating user:', err);
            setError('Failed to update user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ✅ FIXED: Add new user using batchInsert to avoid auto-serial number generation
    const handleAddUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            // Validation
            if (!addForm.name || !addForm.id || !addForm.password) {
                setError("Name, ID, and Password are required");
                setSaving(false);
                return;
            }

            // Check if user ID already exists
            const existingUser = users.find(u => u.id === addForm.id.trim());
            if (existingUser) {
                setError("User ID already exists. Please use a different ID.");
                setSaving(false);
                return;
            }

            // Generate timestamp in dd/MM/yy format
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = String(now.getFullYear()).slice(-2);
            const timestamp = `${day}/${month}/${year}`;

            // ✅ CORRECT ORDER: Matches USER sheet columns exactly
            // Columns: User Name | ID | Password | Role | System ID | Status | Timestamp
            const rowData = [
                addForm.name.trim(),           // Column A: User Name
                addForm.id.trim(),             // Column B: ID
                addForm.password.trim(),       // Column C: Password
                addForm.role,                  // Column D: Role
                addForm.systemId.trim() || "", // Column E: System ID
                addForm.status || "Active",    // Column F: Status
                timestamp                      // Column G: Timestamp
            ];

            console.log("Submitting user data:", rowData);

            // ✅ Use batchInsert with single row to bypass auto-serial number generation
            // This works because your Apps Script's batchInsert doesn't modify the data
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    action: "batchInsert",     // ✅ Changed to batchInsert
                    sheetName: sheetName,
                    rowsData: JSON.stringify([rowData])  // ✅ Wrap in array for batch insert
                })
            });

            const result = await response.json();
            console.log("Insert result:", result);

            if (!result.success) {
                throw new Error(result.error || "Insert failed");
            }

            // Success - close modal and refresh
            setIsAddUserOpen(false);
            setAddForm({
                name: "",
                id: "",
                password: "",
                role: "User",
                systemId: "",
                status: "Active"
            });

            setSuccessMessage("User added successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);
            
            // Refresh the user list
            await fetchData();

        } catch (err) {
            console.error("Error adding user:", err);
            setError(err.message || "Failed to add user. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleUserFieldChange = (rowIndex, field, value) => {
        setUsers(prev => prev.map(u =>
            u.rowIndex === rowIndex ? { ...u, [field]: value } : u
        ));
    };

    // Delete user
    const handleDeleteUser = async (userToDelete) => {
        if (!window.confirm(`Are you sure you want to delete user "${userToDelete.name}"?`)) {
            return;
        }

        setSaving(true);
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('action', 'delete');
            formData.append('sheetName', sheetName);
            formData.append('rowIndex', userToDelete.rowIndex.toString());

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                setSuccessMessage('User deleted successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
                await fetchData();
            } else {
                setError(result.error || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Export data
    const exportData = () => {
        const data = {
            users: users,
            timestamp: new Date().toISOString(),
            exportedBy: user?.id || 'unknown'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setSuccessMessage('Data exported successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading users...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-4 md:p-6">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 backdrop-blur-sm py-2 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage system users and permissions</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={exportData}
                            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Download size={16} />
                            Export Data
                        </button>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setIsAddUserOpen(true)}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} />
                                Add User
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Lock size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
                        <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                            <X size={18} />
                        </button>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
                        <Check size={20} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Success</p>
                            <p className="text-sm">{successMessage}</p>
                        </div>
                        <button onClick={() => setSuccessMessage('')} className="text-green-400 hover:text-green-600">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Current User Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                        user?.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        <Shield size={14} />
                                        {user?.role?.toUpperCase() || 'USER'}
                                    </span>
                                    <span className="text-gray-500 text-sm">ID: {user?.id}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            <p className="text-gray-500 text-sm">Total Users</p>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">User Name</th>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">ID</th>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">Password</th>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">Role</th>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">System ID</th>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">Status</th>
                                    <th className="px-4 md:px-6 py-4 text-xs uppercase tracking-wider font-semibold text-gray-700 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <User size={48} className="text-gray-300 mb-4" />
                                                <p className="text-gray-500 font-medium">No users found</p>
                                                <p className="text-gray-400 text-sm mt-1">Add your first user to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id || u.rowIndex} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <input
                                                        type="text"
                                                        value={u.name}
                                                        onChange={(e) => handleUserFieldChange(u.rowIndex, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-medium text-gray-900">{u.name}</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <input
                                                        type="text"
                                                        value={u.id}
                                                        onChange={(e) => handleUserFieldChange(u.rowIndex, 'id', e.target.value)}
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                                    />
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm font-mono">{u.id}</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <input
                                                        type="text"
                                                        value={u.password}
                                                        onChange={(e) => handleUserFieldChange(u.rowIndex, 'password', e.target.value)}
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                                    />
                                                ) : (
                                                    <span className="text-gray-500 font-mono">••••••••</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleUserFieldChange(u.rowIndex, 'role', e.target.value)}
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    >
                                                        <option value="User">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                        u.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <input
                                                        type="text"
                                                        value={u.systemId}
                                                        onChange={(e) => handleUserFieldChange(u.rowIndex, 'systemId', e.target.value)}
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="text-gray-600">{u.systemId}</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <select
                                                        value={u.status}
                                                        onChange={(e) => handleUserFieldChange(u.rowIndex, 'status', e.target.value)}
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        u.status === 'Active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            u.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></span>
                                                        {u.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {editingUserId === u.rowIndex ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateUser(u)}
                                                            disabled={saving}
                                                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Save"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingUserId(null); fetchData(); }}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        {user?.role === 'admin' && (
                                                            <>
                                                                <button
                                                                    onClick={() => setEditingUserId(u.rowIndex)}
                                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(u)}
                                                                    disabled={saving}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add User Modal */}
                {isAddUserOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between sticky top-0">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New User</h2>
                                    <p className="text-blue-200 text-sm mt-0.5">Create a new user account</p>
                                </div>
                                <button
                                    onClick={() => setIsAddUserOpen(false)}
                                    className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleAddUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            User Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addForm.name}
                                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ID <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addForm.id}
                                            onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                            placeholder="user123"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={addForm.password}
                                                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                                placeholder="••••••••"
                                                required
                                                minLength="4"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            value={addForm.role}
                                            onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="User">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">System ID</label>
                                        <input
                                            type="text"
                                            value={addForm.systemId}
                                            onChange={(e) => setAddForm({ ...addForm, systemId: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="SYS-001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={addForm.status}
                                            onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddUserOpen(false)}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                            {saving ? 'Creating...' : 'Create User'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;