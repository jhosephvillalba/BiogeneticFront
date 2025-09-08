import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createVet, updateVet } from '../actions/vetActions';
import { VetForm } from '../components/VetForm';

const VetDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isNewVet, setIsNewVet] = useState(true);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (vetData) => {
    try {
      if (isNewVet) {
        const result = await dispatch(createVet(vetData));
        setResponse(result);
      } else {
        await dispatch(updateVet(vetData));
      }
      // Si todo va bien y estamos creando, redirigimos al detalle
      if (isNewVet && response && response.id) {
        setTimeout(() => {
          navigate(`/users/vet/${response.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error al crear o actualizar el veterinario:', error);
    }
  };

  return (
    <VetForm onSubmit={handleSubmit} />
  );
};

export default VetDetails; 