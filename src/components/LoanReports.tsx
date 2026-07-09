import { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, AlertCircle, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDateWithSettings } from '../utils/dateFormat';
import { Settings } from '../types';

interface Loan {
  id: string;
  loan_date: string;
  loan_amount: number;
  purpose: string;
  status: 'pending' | 'paid' | 'partial';
  paid_amount: number;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  payment_amount: number;
  sale_id: string | null;
  notes: string | null;
  created_at: string;
}

interface LoanReportsProps {
  settings: Settings;
}

export function LoanReports({ settings }: LoanReportsProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const [newLoan, setNewLoan] = useState({
    loan_amount: '',
    purpose: '',
    loan_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [newPayment, setNewPayment] = useState({
    payment_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadLoans();
    loadLoanPayments();
  }, []);

  const loadLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('loan_date', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoanPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setLoanPayments(data || []);
    } catch (error) {
      console.error('Error loading loan payments:', error);
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('loans')
        .insert({
          loan_amount: parseFloat(newLoan.loan_amount),
          purpose: newLoan.purpose,
          loan_date: newLoan.loan_date,
          notes: newLoan.notes,
          status: 'pending',
          paid_amount: 0
        });

      if (error) throw error;

      setNewLoan({
        loan_amount: '',
        purpose: '',
        loan_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowAddLoan(false);
      loadLoans();
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLoanId) {
      alert('Please select a loan');
      return;
    }

    try {
      const loan = loans.find(l => l.id === selectedLoanId);
      if (!loan) return;

      const paymentAmount = parseFloat(newPayment.payment_amount);
      const newPaidAmount = loan.paid_amount + paymentAmount;
      const newStatus = newPaidAmount >= loan.loan_amount ? 'paid' : 'partial';

      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
          loan_id: selectedLoanId,
          payment_amount: paymentAmount,
          payment_date: newPayment.payment_date,
          notes: newPayment.notes
        });

      if (paymentError) throw paymentError;

      const { error: loanError } = await supabase
        .from('loans')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_date: newStatus === 'paid' ? newPayment.payment_date : null
        })
        .eq('id', selectedLoanId);

      if (loanError) throw loanError;

      setNewPayment({
        payment_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowAddPayment(false);
      setSelectedLoanId('');
      loadLoans();
      loadLoanPayments();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan? All associated payments will also be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadLoans();
      loadLoanPayments();
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan');
    }
  };

  const handleDeletePayment = async (id: string, loanId: string, amount: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      const { error: paymentError } = await supabase
        .from('loan_payments')
        .delete()
        .eq('id', id);

      if (paymentError) throw paymentError;

      const newPaidAmount = Math.max(0, loan.paid_amount - amount);
      const newStatus = newPaidAmount === 0 ? 'pending' : newPaidAmount >= loan.loan_amount ? 'paid' : 'partial';

      const { error: loanError } = await supabase
        .from('loans')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_date: newStatus === 'paid' ? loan.paid_date : null
        })
        .eq('id', loanId);

      if (loanError) throw loanError;

      loadLoans();
      loadLoanPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    }
  };

  const getPaymentsForLoan = (loanId: string) => {
    return loanPayments.filter(p => p.loan_id === loanId);
  };

  const totalLoans = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + loan.paid_amount, 0);
  const totalRemaining = totalLoans - totalPaid;
  const activeLoans = loans.filter(l => l.status !== 'paid').length;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Loan Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddPayment(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Add Payment
          </button>
          <button
            onClick={() => setShowAddLoan(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Loan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Loans</p>
              <p className="text-2xl font-bold text-gray-900">IQD {totalLoans.toFixed(0)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">IQD {totalPaid.toFixed(0)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">IQD {totalRemaining.toFixed(0)}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Loans</p>
              <p className="text-2xl font-bold text-gray-900">{activeLoans}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map(loan => {
                const payments = getPaymentsForLoan(loan.id);
                const remaining = loan.loan_amount - loan.paid_amount;
                const isExpanded = expandedLoanId === loan.id;

                return (
                  <>
                    <tr
                      key={loan.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDateWithSettings(new Date(loan.loan_date), settings.dateFormat)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{loan.purpose}</div>
                        {loan.notes && (
                          <div className="text-xs text-gray-500 mt-1">{loan.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        ${loan.loan_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${loan.paid_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                        ${remaining.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          loan.status === 'paid' ? 'bg-green-100 text-green-800' :
                          loan.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLoan(loan.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && payments.length > 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 mb-2">Payment History ({payments.length})</h4>
                            <div className="space-y-1">
                              {payments.map(payment => (
                                <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">
                                      {formatDateWithSettings(new Date(payment.payment_date), settings.dateFormat)}
                                    </span>
                                    <span className="text-sm font-medium text-green-600">
                                      ${payment.payment_amount.toFixed(2)}
                                    </span>
                                    {payment.notes && (
                                      <span className="text-xs text-gray-500">{payment.notes}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePayment(payment.id, loan.id, payment.payment_amount);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Loan</h3>
            <form onSubmit={handleAddLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newLoan.loan_amount}
                  onChange={(e) => setNewLoan({ ...newLoan, loan_amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={newLoan.purpose}
                  onChange={(e) => setNewLoan({ ...newLoan, purpose: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Purchase inventory, Equipment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Date *
                </label>
                <input
                  type="date"
                  required
                  value={newLoan.loan_date}
                  onChange={(e) => setNewLoan({ ...newLoan, loan_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newLoan.notes}
                  onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddLoan(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add Loan Payment</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Loan *
                </label>
                <select
                  required
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a loan...</option>
                  {loans.filter(l => l.status !== 'paid').map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.purpose} - ${(loan.loan_amount - loan.paid_amount).toFixed(2)} remaining
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPayment.payment_amount}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Payment details..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPayment(false);
                    setSelectedLoanId('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
