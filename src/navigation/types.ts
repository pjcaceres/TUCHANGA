export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Terminos: undefined;
  Privacidad: undefined;
};

export type AppStackParamList = {
  WorkersList: undefined;
  WorkerProfile: { workerId: string; nombre: string };
  Premium: undefined;
  DejarResena: { workerId: string; nombreTrabajador: string };
  Configuracion: undefined;
  Terminos: undefined;
  Privacidad: undefined;
  MisChats: undefined;
  Chat: { conversacionId: string; nombreOtroUsuario: string };
  EditarPerfil: undefined;
  EditarPerfilCliente: undefined;
  PublicacionesFeed: undefined;
  PublicarTrabajo: undefined;
  MiPerfil: undefined;
};
