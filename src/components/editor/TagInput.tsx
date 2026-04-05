import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = '輸入標籤...' }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tag = inputValue.trim().replace(/^#/, '');
      if (tag && !tags.includes(tag)) {
        onChange([...tags, tag]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-white border border-milk-tea-200 rounded-xl focus-within:border-milk-tea-400 transition-colors">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 bg-milk-tea-100 text-milk-tea-700 rounded-lg text-xs font-medium"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 hover:text-milk-tea-900 transition-colors"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-milk-tea-800 placeholder:text-milk-tea-300"
      />
    </div>
  );
};
