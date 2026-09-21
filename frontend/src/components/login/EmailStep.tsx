import React, { useState } from 'react';

interface EmailStepProps {
  onNext: (email: string) => void;
  onSwitchToRegister: () => void;
}

export const EmailStep: React.FC<EmailStepProps> = ({ onNext }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onNext(email);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Correo electrónico
        <input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <button type="submit" className="button wide">
        Entrar a mi espacio →
      </button>
    </form>
  );
};