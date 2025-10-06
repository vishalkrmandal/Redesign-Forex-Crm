// Frontend\src\pages\client\account\AccountList.tsx

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Lock, EyeOff, Eye, Copy } from "lucide-react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Interfaces
interface Account {
  _id: string;
  mt5Account: string;
  user: string;
  accountType: string;
  platform: string;
  balance: number;
  equity: number;
  status: boolean;
  leverage: string;
  name: string;
  investor_pwd: string;
  master_pwd: string;
  groupName: string;
  managerIndex: string;
  createdAt: string;
  updatedAt: string;
}

interface SummaryData {
  totalBalance: number;
  totalEquity: number;
  totalPL: number;
}

interface ApiResponse {
  success: boolean;
  data: Account[];
  message?: string;
}

interface PasswordDialogState {
  isOpen: boolean;
  accountId: string;
  accountNumber: string;
  leverage: string;
  investor_pwd: string;
  master_pwd: string;
  newInvestorPwd: string;
  confirmInvestorPwd: string;
  newMasterPwd: string;
  confirmMasterPwd: string;
  isChangingInvestor: boolean;
  isChangingMaster: boolean;
  showNewInvestorPwd: boolean;
  showConfirmInvestorPwd: boolean;
  showNewMasterPwd: boolean;
  showConfirmMasterPwd: boolean;
  investorPwdErrors: string[];
  masterPwdErrors: string[];
}

export default function AccountList() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summary, setSummary] = useState<SummaryData>({
    totalBalance: 0,
    totalEquity: 0,
    totalPL: 0
  });

  // Password dialog state
  const [passwordDialog, setPasswordDialog] = useState<PasswordDialogState>({
    isOpen: false,
    accountId: "",
    accountNumber: "",
    leverage: "",
    investor_pwd: "",
    master_pwd: "",
    newInvestorPwd: "",
    confirmInvestorPwd: "",
    newMasterPwd: "",
    confirmMasterPwd: "",
    isChangingInvestor: false,
    isChangingMaster: false,
    showNewInvestorPwd: false,
    showConfirmInvestorPwd: false,
    showNewMasterPwd: false,
    showConfirmMasterPwd: false,
    investorPwdErrors: [],
    masterPwdErrors: []
  });

  const ACCOUNTS_PER_PAGE = 10;

  // Helper function to trigger account balance update
  const triggerAccountBalanceUpdate = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const userData = JSON.parse(localStorage.getItem('clientUser') || '{}');
      const userId = userData.id;

      console.log('Token:', token ? 'exists' : 'missing');
      console.log('UserId:', userId);

      if (!token || !userId) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/users/${userId}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response:', response.data);

    } catch (error) {
      if (error instanceof Error) {
        console.log('Error:', error.message);
      } else {
        console.log('Error:', error);
      }
    }
  };

  // Fetch accounts from the backend
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("clientToken");
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        const accountsData: Account[] = response.data.data;

        if (Array.isArray(accountsData)) {
          setAccounts(accountsData);
          setTotalPages(Math.ceil(accountsData.length / ACCOUNTS_PER_PAGE));

          // Calculate summary data
          const totalBalance = accountsData.reduce((sum: number, account: Account) =>
            sum + (typeof account.balance === 'number' ? account.balance : 0), 0);

          const totalEquity = accountsData.reduce((sum: number, account: Account) =>
            sum + (typeof account.equity === 'number' ? account.equity : 0), 0);

          const totalPL = totalEquity - totalBalance;

          setSummary({
            totalBalance,
            totalEquity,
            totalPL
          });
        } else {
          setAccounts([]);
          setTotalPages(1);
          setSummary({
            totalBalance: 0,
            totalEquity: 0,
            totalPL: 0
          });
        }
      } else {
        setError(response.data.message || "Failed to fetch accounts");
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      const error = err as AxiosError;
      setError(error.message || "An error occurred while fetching accounts");
    } finally {
      setLoading(false);
    }
  };

  // Refresh account data
  // const handleRefresh = async (accountId: string) => {
  //   try {
  //     const token = localStorage.getItem("clientToken");
  //     await axios.post(`${API_BASE_URL}/api/accounts/${accountId}/refresh`, {}, {
  //       headers: {
  //         Authorization: `Bearer ${token}`
  //       }
  //     });
  //     fetchAccounts();
  //   } catch (err) {
  //     console.error("Error refreshing account:", err);
  //     alert("Failed to refresh account data. Please try again.");
  //   }
  // };

  // Open new account handler
  const handleOpenNewAccount = () => {
    window.location.href = "/client/account/new";
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get current page accounts
  const getCurrentPageAccounts = () => {
    const startIndex = (currentPage - 1) * ACCOUNTS_PER_PAGE;
    const endIndex = startIndex + ACCOUNTS_PER_PAGE;
    return accounts.slice(startIndex, endIndex);
  };

  // Add this function after formatCurrency function
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must include at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must include at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must include at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push("Password must include at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Password dialog handlers
  const openPasswordDialog = (account: Account) => {
    setPasswordDialog({
      isOpen: true,
      accountId: account._id,
      accountNumber: account.mt5Account,
      leverage: account.leverage,
      investor_pwd: account.investor_pwd,
      master_pwd: account.master_pwd,
      newInvestorPwd: "",
      confirmInvestorPwd: "",
      newMasterPwd: "",
      confirmMasterPwd: "",
      isChangingInvestor: false,
      isChangingMaster: false,
      showNewInvestorPwd: false,
      showConfirmInvestorPwd: false,
      showNewMasterPwd: false,
      showConfirmMasterPwd: false,
      investorPwdErrors: [],
      masterPwdErrors: []
    });
  };

  const closePasswordDialog = () => {
    setPasswordDialog({
      ...passwordDialog,
      isOpen: false,
      newInvestorPwd: "",
      confirmInvestorPwd: "",
      newMasterPwd: "",
      confirmMasterPwd: "",
      isChangingInvestor: false,
      isChangingMaster: false,
      showNewInvestorPwd: false,
      showConfirmInvestorPwd: false,
      showNewMasterPwd: false,
      showConfirmMasterPwd: false,
      investorPwdErrors: [],
      masterPwdErrors: []
    });
  };

  const toggleInvestorChange = () => {
    setPasswordDialog({
      ...passwordDialog,
      isChangingInvestor: !passwordDialog.isChangingInvestor,
      newInvestorPwd: "",
      confirmInvestorPwd: ""
    });
  };

  const toggleMasterChange = () => {
    setPasswordDialog({
      ...passwordDialog,
      isChangingMaster: !passwordDialog.isChangingMaster,
      newMasterPwd: "",
      confirmMasterPwd: ""
    });
  };

  const handlePasswordChange = async () => {
    try {
      const token = localStorage.getItem("clientToken");
      const payload: any = {};
      let hasChanges = false;
      let hasErrors = false;

      // Validate investor password change
      if (passwordDialog.isChangingInvestor) {
        if (!passwordDialog.newInvestorPwd) {
          toast.error("New investor password cannot be empty");
          hasErrors = true;
        } else if (passwordDialog.newInvestorPwd !== passwordDialog.confirmInvestorPwd) {
          toast.error("Investor passwords do not match");
          hasErrors = true;
        } else {
          // Validate password strength
          const validation = validatePassword(passwordDialog.newInvestorPwd);
          if (!validation.isValid) {
            toast.error(validation.errors[0]); // Show first error
            hasErrors = true;
          } else {
            payload.investor_pwd = passwordDialog.newInvestorPwd;
            hasChanges = true;
          }
        }
      }

      // Validate master password change
      if (passwordDialog.isChangingMaster && !hasErrors) {
        if (!passwordDialog.newMasterPwd) {
          toast.error("New master password cannot be empty");
          hasErrors = true;
        } else if (passwordDialog.newMasterPwd !== passwordDialog.confirmMasterPwd) {
          toast.error("Master passwords do not match");
          hasErrors = true;
        } else {
          // Validate password strength
          const validation = validatePassword(passwordDialog.newMasterPwd);
          if (!validation.isValid) {
            toast.error(validation.errors[0]); // Show first error
            hasErrors = true;
          } else {
            payload.master_pwd = passwordDialog.newMasterPwd;
            hasChanges = true;
          }
        }
      }

      // Proceed with API call if validations pass
      if (hasChanges && !hasErrors) {
        await axios.put(
          `${API_BASE_URL}/api/accounts/${passwordDialog.accountId}/passwords`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        toast.success("Password(s) updated successfully");
        closePasswordDialog();
        fetchAccounts(); // Refresh accounts to get updated data
      }
    } catch (err) {
      console.error("Error updating passwords:", err);
      toast.error("Failed to update password(s). Please try again.");
    }
  };

  // Fetch accounts on component mount
  useEffect(() => {

    // Trigger account balance update on initial load
    triggerAccountBalanceUpdate();

    fetchAccounts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Trading Accounts</h1>
          <p className="text-muted-foreground">Manage and monitor all your trading accounts.</p>
        </div>
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          onClick={handleOpenNewAccount}
        >
          Open New Account
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-red-50 p-4 text-red-800">
          <p>Error: {error}</p>
          <button
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
            onClick={fetchAccounts}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Account</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Platform</th>
                  <th className="px-4 py-3 text-left font-medium">Leverage</th>
                  <th className="px-4 py-3 text-left font-medium">Balance</th>
                  <th className="px-4 py-3 text-left font-medium">Equity</th>
                  <th className="px-4 py-3 text-left font-medium">Profit/Loss</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageAccounts().length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No accounts found. Click "Open New Account" to create one.
                    </td>
                  </tr>
                ) : (
                  getCurrentPageAccounts().map((account) => {
                    const profitLoss = account.equity - account.balance;
                    const isProfitable = profitLoss >= 0;

                    return (
                      <tr key={account._id} className="border-b last:border-0">
                        <td className="px-4 py-4 text-sm font-medium">{account.mt5Account}</td>
                        <td className="px-4 py-4 text-sm">{account.name}</td>
                        <td className="px-4 py-4 text-sm">{account.accountType}</td>
                        <td className="px-4 py-4 text-sm">{account.platform}</td>
                        <td className="px-4 py-4 text-sm">1:{account.leverage}</td>
                        <td className="px-4 py-4 text-sm">{formatCurrency(account.balance)}</td>
                        <td className="px-4 py-4 text-sm">{formatCurrency(account.equity)}</td>
                        <td
                          className={`px-4 py-4 text-sm font-medium ${isProfitable ? "text-green-600" : "text-red-600"}`}
                        >
                          {isProfitable ? "+" : ""}{formatCurrency(profitLoss)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${account.status
                              ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                              }`}
                          >
                            {account.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            {/* <button
                              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              title="View Details"
                              onClick={() => window.location.href = `/accounts/${account._id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button> */}
                            <button
                              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              title="Change Passwords"
                              onClick={() => openPasswordDialog(account)}
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                            {/* <button
                              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              title="Refresh Account"
                              onClick={() => handleRefresh(account._id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {accounts.length > ACCOUNTS_PER_PAGE && (
            <div className="flex items-center justify-between border-t px-4 py-2">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ACCOUNTS_PER_PAGE + 1} to {Math.min(currentPage * ACCOUNTS_PER_PAGE, accounts.length)} of {accounts.length} accounts
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`rounded-md p-1 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  disabled={currentPage === 1}
                  onClick={goToPreviousPage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <button
                  className={`rounded-md p-1 ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  disabled={currentPage === totalPages}
                  onClick={goToNextPage}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">Account Summary</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="font-medium">{formatCurrency(summary.totalBalance)}</p>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <p className="text-sm text-muted-foreground">Total Equity</p>
              <p className="font-medium">{formatCurrency(summary.totalEquity)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
              <p className={`font-medium ${summary.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                {summary.totalPL >= 0 ? "+" : ""}{formatCurrency(summary.totalPL)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">Quick Actions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => navigate("/client/financial/deposit")}
              className="flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Deposit Funds
            </button>
            <button
              onClick={() => navigate("/client/financial/withdrawal")}
              className="flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Withdraw Funds
            </button>
            <button
              onClick={() => navigate("/client/financial/transfer")}
              className="flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Internal Transfer
            </button>
            <button
              onClick={() => window.open("https://example.com/platform-download", "_blank")}
              className="flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Download Platform
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      {passwordDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg  p-6 shadow-lg bg-card">
            <h3 className="mb-4 text-lg font-medium">Account Passwords</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Account</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={passwordDialog.accountNumber}
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Leverage</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={`1:${passwordDialog.leverage}`}
                    disabled
                  />
                </div>
              </div>

              {/* Investor Password Section */}
              <div className="rounded-md border p-3 ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium">Investor Password:</h4>
                  </div>

                  <button
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={toggleInvestorChange}
                  >
                    {passwordDialog.isChangingInvestor ? "Cancel" : "Change"}
                  </button>
                </div>

                {passwordDialog.isChangingInvestor ? (
                  <div className="mt-2 space-y-2 bg-card">
                    <div className="relative">
                      <input
                        type={passwordDialog.showNewInvestorPwd ? "text" : "password"}
                        className={`w-full rounded-md border px-3 py-2 pr-10 text-sm ${passwordDialog.newInvestorPwd && passwordDialog.investorPwdErrors.length > 0
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-input'
                          }`}
                        placeholder="New investor password"
                        value={passwordDialog.newInvestorPwd}
                        onChange={(e) => {
                          const validation = validatePassword(e.target.value);
                          setPasswordDialog({
                            ...passwordDialog,
                            newInvestorPwd: e.target.value,
                            investorPwdErrors: e.target.value ? validation.errors : []
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setPasswordDialog({ ...passwordDialog, showNewInvestorPwd: !passwordDialog.showNewInvestorPwd })}
                      >
                        {passwordDialog.showNewInvestorPwd ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password requirements */}
                    {passwordDialog.newInvestorPwd && (
                      <div className="text-xs space-y-1">
                        <div className={`flex items-center space-x-1 ${passwordDialog.newInvestorPwd.length >= 8 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{passwordDialog.newInvestorPwd.length >= 8 ? '✓' : '✗'}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[A-Z]/.test(passwordDialog.newInvestorPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[A-Z]/.test(passwordDialog.newInvestorPwd) ? '✓' : '✗'}</span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[a-z]/.test(passwordDialog.newInvestorPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[a-z]/.test(passwordDialog.newInvestorPwd) ? '✓' : '✗'}</span>
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[0-9]/.test(passwordDialog.newInvestorPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[0-9]/.test(passwordDialog.newInvestorPwd) ? '✓' : '✗'}</span>
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(passwordDialog.newInvestorPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(passwordDialog.newInvestorPwd) ? '✓' : '✗'}</span>
                          <span>One special character</span>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type={passwordDialog.showConfirmInvestorPwd ? "text" : "password"}
                        className={`w-full rounded-md border px-3 py-2 pr-10 text-sm ${passwordDialog.confirmInvestorPwd && passwordDialog.newInvestorPwd !== passwordDialog.confirmInvestorPwd
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-input'
                          }`}
                        placeholder="Confirm new investor password"
                        value={passwordDialog.confirmInvestorPwd}
                        onChange={(e) => setPasswordDialog({ ...passwordDialog, confirmInvestorPwd: e.target.value })}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setPasswordDialog({ ...passwordDialog, showConfirmInvestorPwd: !passwordDialog.showConfirmInvestorPwd })}
                      >
                        {passwordDialog.showConfirmInvestorPwd ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password match indicator */}
                    {passwordDialog.confirmInvestorPwd && (
                      <div className={`text-xs ${passwordDialog.newInvestorPwd === passwordDialog.confirmInvestorPwd ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {passwordDialog.newInvestorPwd === passwordDialog.confirmInvestorPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm"
                        value={passwordDialog.investor_pwd}
                        readOnly
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          navigator.clipboard.writeText(passwordDialog.investor_pwd);
                          toast.success("Investor password copied to clipboard");
                        }}
                        title="Copy password"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Master Password Section */}
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium">Master Password:</h4>
                  </div>
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={toggleMasterChange}
                  >
                    {passwordDialog.isChangingMaster ? "Cancel" : "Change"}
                  </button>
                </div>

                {passwordDialog.isChangingMaster ? (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <input
                        type={passwordDialog.showNewMasterPwd ? "text" : "password"}
                        className={`w-full rounded-md border px-3 py-2 pr-10 text-sm ${passwordDialog.newMasterPwd && passwordDialog.masterPwdErrors.length > 0
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-input'
                          }`}
                        placeholder="New master password"
                        value={passwordDialog.newMasterPwd}
                        onChange={(e) => {
                          const validation = validatePassword(e.target.value);
                          setPasswordDialog({
                            ...passwordDialog,
                            newMasterPwd: e.target.value,
                            masterPwdErrors: e.target.value ? validation.errors : []
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setPasswordDialog({ ...passwordDialog, showNewMasterPwd: !passwordDialog.showNewMasterPwd })}
                      >
                        {passwordDialog.showNewMasterPwd ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password requirements */}
                    {passwordDialog.newMasterPwd && (
                      <div className="text-xs space-y-1">
                        <div className={`flex items-center space-x-1 ${passwordDialog.newMasterPwd.length >= 8 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{passwordDialog.newMasterPwd.length >= 8 ? '✓' : '✗'}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[A-Z]/.test(passwordDialog.newMasterPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[A-Z]/.test(passwordDialog.newMasterPwd) ? '✓' : '✗'}</span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[a-z]/.test(passwordDialog.newMasterPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[a-z]/.test(passwordDialog.newMasterPwd) ? '✓' : '✗'}</span>
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[0-9]/.test(passwordDialog.newMasterPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[0-9]/.test(passwordDialog.newMasterPwd) ? '✓' : '✗'}</span>
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(passwordDialog.newMasterPwd) ? 'text-green-600' : 'text-red-600'
                          }`}>
                          <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(passwordDialog.newMasterPwd) ? '✓' : '✗'}</span>
                          <span>One special character</span>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type={passwordDialog.showConfirmMasterPwd ? "text" : "password"}
                        className={`w-full rounded-md border px-3 py-2 pr-10 text-sm ${passwordDialog.confirmMasterPwd && passwordDialog.newMasterPwd !== passwordDialog.confirmMasterPwd
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-input'
                          }`}
                        placeholder="Confirm new master password"
                        value={passwordDialog.confirmMasterPwd}
                        onChange={(e) => setPasswordDialog({ ...passwordDialog, confirmMasterPwd: e.target.value })}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setPasswordDialog({ ...passwordDialog, showConfirmMasterPwd: !passwordDialog.showConfirmMasterPwd })}
                      >
                        {passwordDialog.showConfirmMasterPwd ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password match indicator */}
                    {passwordDialog.confirmMasterPwd && (
                      <div className={`text-xs ${passwordDialog.newMasterPwd === passwordDialog.confirmMasterPwd ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {passwordDialog.newMasterPwd === passwordDialog.confirmMasterPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm"
                        value={passwordDialog.master_pwd}
                        readOnly
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          navigator.clipboard.writeText(passwordDialog.master_pwd);
                          toast.success("Master password copied to clipboard");
                        }}
                        title="Copy password"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={closePasswordDialog}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={handlePasswordChange}
                disabled={!passwordDialog.isChangingInvestor && !passwordDialog.isChangingMaster}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}