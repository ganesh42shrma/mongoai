import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from "react-router-dom";
import App from './App.jsx'
import ModelSelection from './pages/ModelSelection.jsx';
import './index.css'


const router = createHashRouter([
 {
   path: "/",
   element: <App />,
 },
 {
   path: "/models",
   element: <ModelSelection />,
 },
]);


ReactDOM.createRoot(document.getElementById('root')).render(
 <React.StrictMode>
   <RouterProvider router={router} />
 </React.StrictMode>,
)