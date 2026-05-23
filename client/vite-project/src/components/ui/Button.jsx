/* Button variants: primary | danger | ghost | secondary */
export const Button = ({ children, variant = "primary", loading = false, className = "", ...props }) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 scale-98-active";
    const variants = {
        primary: "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-ambient-sm hover:shadow-ambient hover:-translate-y-0.5",
        danger: "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-ambient-sm hover:shadow-ambient hover:-translate-y-0.5 focus:ring-rose-400",
        ghost: "ghost-border bg-surface-container-lowest/70 text-on-surface hover:bg-surface-container-low hover:-translate-y-0.5",
        secondary: "glass-panel text-on-surface hover:bg-surface-container-low/70 hover:-translate-y-0.5",
    };
    return (
        <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
            {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            )}
            {children}
        </button>
    );
};
