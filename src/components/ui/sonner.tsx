import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster"
      toastOptions={{
        classNames: {
          // keep the base toast class so we can target it from CSS
          toast: "toast",
          // description, action and cancel buttons inside the toast
          description: "toast-description text-sm",
          actionButton: "toast-action",
          cancelButton: "toast-cancel",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
