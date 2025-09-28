import React from 'react';
import { createRoot } from 'react-dom/client';
import EducationApp from './EducationApp';
import './index.css'; // optional if you have custom styles

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<EducationApp />);
