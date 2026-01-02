import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export const isBiometricAvailable = async () => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch {
    return false;
  }
};

export const verifyBiometric = async (promptMessage = 'Gunakan biometrik untuk masuk') => {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    return success;
  } catch {
    return false;
  }
};
