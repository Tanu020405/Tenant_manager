/* Button variants: primary | danger | ghost */
export const Button = ({ children, variant = "primary", loading = false, className = "", ...props }) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60";
    const variants = {
        primary: "bg-[color:var(--color-accent)] text-white hover:brightness-105 focus:ring-[color:var(--color-accent)]",
        danger: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400",
        ghost: "border border-slate-200 bg-white text-[color:var(--color-text)] hover:bg-slate-50 focus:ring-slate-300",
    };
    return (
        <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
            {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {children}
        </button>
    );
};
