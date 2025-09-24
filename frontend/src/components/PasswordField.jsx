import React, { useState } from 'react';
import { Field, ErrorMessage } from 'formik';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const PasswordField = ({ name, label }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <label className="block mb-1 text-sm font-medium">{label}</label>
      <Field
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-300 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-500 hover:text-blue-900"
      >
        {show ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />  }
      </button>
      <ErrorMessage name={name} component="div" className="text-red-500 text-xs mt-1" />
    </div>
  );
};

export default PasswordField;
