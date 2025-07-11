import axios from "axios";
import { apiBaseUrl } from "../config";

const apiServiceUrl = "barbershop";

const BarbershopService = {
  getToken: () => localStorage.getItem("token"),

  store: async (barbershopData) => {
    const headers = {
      Authorization: `Bearer ${BarbershopService.getToken()}`,
      "Content-Type": "multipart/form-data", // Importante para envio de arquivos
    };

    const formData = new FormData();
    // Adiciona os dados da barbearia ao FormData
    for (const key in barbershopData) {
      formData.append(key, barbershopData[key]);
    }

    // Faz a requisição à API
    return await axios.post(`${apiBaseUrl}/${apiServiceUrl}`, formData, { headers });
  },

  listAll: async () => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };

      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}`, {
        headers,
      });

      if (response.status === 200) {
        return response.data; // Retorna a lista de todas as barbearias
      } else {
        throw new Error(
          "Erro ao obter a lista de barbearias. Por favor, tente novamente."
        );
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Erro ao obter a lista de barbearias. Por favor, tente novamente."
      );
    }
  },
  myBarbershops: async () => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };

      const response = await axios.get(`${apiBaseUrl}/${apiServiceUrl}/myBarbershops`, {
        headers,
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(
          "Erro ao obter a lista de barbearias. Por favor, tente novamente."
        );
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Erro ao obter a lista de barbearias. Por favor, tente novamente."
      );
    }
  },

  show: async (id) => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };

      const response = await axios.get(
        `${apiBaseUrl}/${apiServiceUrl}/show/${id}`,
        {
          headers,
        }
      );

      if (response.status === 200) {
        return response.data; // Retorna os dados da barbearia
      } else {
        throw new Error(
          "Erro ao obter os dados da barbearia. Por favor, tente novamente."
        );
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Erro ao obter os dados da barbearia. Por favor, tente novamente."
      );
    }
  },
  update: async (id, formData) => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${BarbershopService.getToken()}`,
          },
        }
      );

      return response.data.message; // Retorna a mensagem de sucesso
    } catch (error) {
      if (error.response && error.response.data.errors) {
        throw error.response.data.errors; // Retorna erros de validação
      } else {
        throw new Error("Erro ao atualizar a barbearia. Por favor, tente novamente.");
      }
    }
  },
  // Função para deletar barbearia
  destroy: async (id) => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };

      const response = await axios.delete(
        `${apiBaseUrl}/${apiServiceUrl}/${id}`,
        {
          headers,
        }
      );

      if (response.status === 200) {
        return response.data.message;
      } else {
        throw new Error(
          "Erro ao deletar barbearia. Por favor, tente novamente."
        );
      }
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data.error || "Erro ao se conectar ao servidor."
        );
      } else {
        throw new Error("Erro ao se conectar ao servidor.");
      }
    }
  },
  listBarbers: async (barbershopId) => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };

      const response = await axios.get(
        `${apiBaseUrl}/${apiServiceUrl}/barbers/${barbershopId}`,
        {
          headers,
        }
      );

      if (response.status === 200) {
        return response.data; // Retorna a lista de barbeiros
      } else {
        throw new Error(
          "Erro ao obter a lista de barbeiros. Por favor, tente novamente."
        );
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Erro ao obter a lista de barbeiros. Por favor, tente novamente."
      );
    }
  },
  removeBarber: async (barbershopId, barberId) => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };
  
      const response = await axios.delete(
        `${apiBaseUrl}/${apiServiceUrl}/barber/${barberId}/${barbershopId}`,
        {
          headers,
        }
      );
  
      if (response.status === 200) {
        return response.data.message; // Retorna a mensagem de sucesso
      } else {
        throw new Error("Erro ao remover barbeiro. Por favor, tente novamente.");
      }
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data.error || "Erro ao se conectar ao servidor."
        );
      } else {
        throw new Error("Erro ao se conectar ao servidor.");
      }
    }
  },


  // Função para adicionar barbeiro a uma barbearia
  addBarber: async (barbershopId, barber_email) => {
    try {
      const headers = {
        Authorization: `Bearer ${BarbershopService.getToken()}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/barber/${barbershopId}`,
        { barber_email: barber_email }, // Envia o email do barbeiro no corpo da requisição
        { headers }
      );

      if (response.status === 200) {
        return response // Retorna a mensagem de sucesso
      } else {
        throw new Error("Erro ao adicionar barbeiro. Por favor, tente novamente.");
      }
    } catch (error) {
      if (error.response && error.response.data.error) {
        throw new Error(error.response.data.error); // Retorna o erro específico da API
      } else {
        throw new Error("Erro ao adicionar barbeiro. Por favor, tente novamente.");
      }
    }
  },

};

export default BarbershopService;
