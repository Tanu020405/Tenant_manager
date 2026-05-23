export const Spinner = ({ size = "md" }) => {
    const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
    const borderSizes = { sm: "border-2", md: "border-2", lg: "border-[3px]" };
    return (
        <span className="relative inline-flex items-center justify-center">
            <span
                className={`block animate-spin rounded-full ${borderSizes[size]} border-primary/20 border-t-primary ${sizes[size]}`}
            />
            <span
                className={`absolute block animate-spin rounded-full ${borderSizes[size]} border-tertiary/10 border-b-tertiary ${sizes[size]}`}
                style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
            />
        </span>
    );
};

export const PageSpinner = () => (
    <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
    </div>
);
