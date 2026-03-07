import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    onClick,
    type = 'button',
    disabled = false,
    fullWidth = false
}) => {
    const className = `btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`;

    return (
        <button
            className={className}
            onClick={onClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
