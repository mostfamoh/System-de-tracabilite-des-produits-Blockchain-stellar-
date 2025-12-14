import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes } from 'react-icons/fa';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    company_name: '',
    phone: '',
    address: '',
    tax_id: '',
    role: 'CLIENT',
    password: '',
    password_confirmation: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { search, page };
      const data = await adminService.getUsers(params);
      setUsers(data.results || data || []);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveToggle = async (user) => {
    try {
      const payload = { ...user, is_approved: !user.is_approved };
      await adminService.updateUser(user.id, payload);
      toast.success(`${user.company_name} approval status updated`);
      fetchUsers();
    } catch (err) {
      console.error('Approve toggle failed', err);
      toast.error('Action failed');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.password !== createForm.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setCreatingUser(true);
      const payload = {
        email: createForm.email,
        company_name: createForm.company_name,
        phone: createForm.phone,
        address: createForm.address,
        tax_id: createForm.tax_id,
        role: createForm.role,
        password: createForm.password,
        password_confirmation: createForm.password_confirmation,
        is_approved: true,
      };
      await adminService.createUser(payload);
      toast.success(`User ${createForm.email} created and approved`);
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        company_name: '',
        phone: '',
        address: '',
        tax_id: '',
        role: 'CLIENT',
        password: '',
        password_confirmation: '',
      });
      fetchUsers();
    } catch (err) {
      console.error('User creation failed', err);
      toast.error(err?.response?.data?.detail || 'User creation failed');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.company_name}? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(user.id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <div className="flex gap-3 items-center">
          <div className="w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or company"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaPlus /> Create User
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Company</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Role</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Approved</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{u.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{u.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <button
                        onClick={() => handleApproveToggle(u)}
                        className={`px-3 py-1 rounded ${u.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {u.is_approved ? 'Approved' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-800 mr-3">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.company_name}
                  onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="CLIENT">CLIENT</option>
                  <option value="FABRICANT">FABRICANT</option>
                  <option value="TRANSPORT">TRANSPORT</option>
                  <option value="ENTREPOT">ENTREPOT</option>
                  <option value="MAGASIN">MAGASIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax ID</label>
                <input
                  type="text"
                  value={createForm.tax_id}
                  onChange={(e) => setCreateForm({ ...createForm, tax_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={createForm.password_confirmation}
                  onChange={(e) => setCreateForm({ ...createForm, password_confirmation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;