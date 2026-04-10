import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface OTPVerificationProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    updateType: 'personalInfo' | 'accountDetails' | 'walletDetails';
    formData: any;
    onVerified: () => void;
}

const OTPVerification = ({ open, onOpenChange, updateType, formData, onVerified }: OTPVerificationProps) => {
    const [otp, setOtp] = useState('');
    const [otpKey, setOtpKey] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Send OTP when dialog opens
    useEffect(() => {
        if (open && !otpSent && formData) {
            sendOTP();
        }
    }, [open]);

    const sendOTP = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('clientToken');

            const response = await axios.post(
                `${API_BASE_URL}/api/otp/profile-update/send`,
                { updateType, formData },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (response.data.success) {
                setOtpKey(response.data.otpKey);
                setOtpSent(true);
                toast.success('OTP sent to your email');

                // Start cooldown
                setResendCooldown(60);
                const interval = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            toast.error('Failed to send OTP');
            onOpenChange(false); // Close dialog if OTP sending fails
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('clientToken');

            const response = await axios.post(
                `${API_BASE_URL}/api/otp/profile-update/verify`,
                { otpKey, otp },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (response.data.success) {
                toast.success('OTP verified successfully');
                onVerified();
                handleClose();
            }
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOtp('');
        setOtpKey('');
        setOtpSent(false);
        setResendCooldown(0);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                handleClose();
            }
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>OTP Verification</DialogTitle>
                    <DialogDescription>
                        {!otpSent
                            ? 'Sending OTP to your email...'
                            : 'Enter the 6-digit OTP sent to your email address'}
                    </DialogDescription>
                </DialogHeader>

                {!otpSent && loading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}

                {otpSent && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Enter OTP</Label>
                            <Input
                                id="otp"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(value);
                                }}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-2xl tracking-widest font-mono"
                                autoFocus
                            />
                        </div>

                        <div className="text-sm text-center">
                            {resendCooldown > 0 ? (
                                <p className="text-gray-500">
                                    Resend OTP in {resendCooldown}s
                                </p>
                            ) : (
                                <Button
                                    variant="link"
                                    onClick={sendOTP}
                                    disabled={loading}
                                    className="p-0 h-auto"
                                >
                                    Resend OTP
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    {otpSent && (
                        <Button
                            onClick={verifyOTP}
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify & Update'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OTPVerification;