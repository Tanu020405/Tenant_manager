export const Spinner = ({ size = "md" }) => {
    const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
    return (
        <span
            className={`block animate-spin rounded-full border-2 border-slate-200 border-t-[color:var(--color-accent)] ${sizes[size]}`}
        />
    );
};

export const PageSpinner = () => (
    <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
    </div>
);
