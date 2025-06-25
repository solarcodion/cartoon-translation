import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMoreHorizontal } from "react-icons/fi";

interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  buttonClassName?: string;
}

export default function DropdownMenu({
  items,
  isOpen,
  onToggle,
  onClose,
  buttonClassName = "",
}: DropdownMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 128; // w-32 = 128px
      const dropdownHeight = items.length * 40; // Approximate height per item
      
      let top = buttonRect.bottom + 4; // 4px gap
      let left = buttonRect.right - dropdownWidth;

      // Adjust if dropdown would go off screen
      if (left < 8) {
        left = 8;
      }
      
      if (top + dropdownHeight > window.innerHeight - 8) {
        top = buttonRect.top - dropdownHeight - 4;
      }

      setPosition({ top, left });
    }
  }, [isOpen, items.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${
            index === 0 ? "rounded-t-lg" : ""
          } ${index === items.length - 1 ? "rounded-b-lg" : ""} ${
            item.className || "text-gray-700"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer ${buttonClassName}`}
      >
        <FiMoreHorizontal className="text-lg" />
      </button>
      
      {/* Render dropdown in portal to avoid z-index issues */}
      {typeof window !== "undefined" && dropdownContent && 
        createPortal(dropdownContent, document.body)
      }
    </>
  );
}
