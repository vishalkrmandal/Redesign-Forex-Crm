import PaymentMethod from "./components/PaymentMethod"

export default function ConfigurationPage() {
    return (
        <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0 }}>Configuration</h1>
                <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', marginTop: 4 }}>Manage payment methods and exchange rates</p>
            </div>
            <PaymentMethod />
        </div>
    )
}
