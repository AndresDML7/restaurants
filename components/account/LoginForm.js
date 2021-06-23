import React, { useState } from 'react';
import { StyleSheet, Text, View, Platform, Alert } from 'react-native';
import { Input, Icon, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import * as GoogleSignIn from 'expo-google-sign-in';
import * as firebase from 'firebase'

import Loading from '../Loading';
import { validateEmail } from '../../utils/helpers';
import { loginWithEmailAndPassword } from '../../utils/actions';
import { isEmpty } from 'lodash';

export default function LoginForm() {

    const navigation = useNavigation();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState(defaultFormValues());
    const [errorEmail, setErrorEmail] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onChange = (e, type) => {
        setFormData({ ...formData, [type]: e.nativeEvent.text});
    }

    async function googleSignInAsync() {
        try {
            await GoogleSignIn.initAsync()
            if (Platform.OS === "android") {
                await GoogleSignIn.askForPlayServicesAsync()
            }
            const { type, user } = await GoogleSignIn.signInAsync()
            if (type === "success") {
                onSignIn(user)
                setLoading(false)
                return true
            } else {
                setLoading(false)
                Alert.alert(JSON.stringify(result))
                return { cancelled: true }
            }
        } catch (error) {
            setLoading(false)
            Alert.alert(error.message)
            return { error: true }
        }
    }
      
    function onSignIn(googleUser) {
        const unsubscribe = firebase
            .auth()
            .onAuthStateChanged(function (firebaseUser) {
                unsubscribe()
                if (!isUserEqual(googleUser, firebaseUser)) {
                    const credential = firebase.auth.GoogleAuthProvider.credential(
                        googleUser.auth.idToken,
                        googleUser.auth.accessToken
                    )
                    setLoading(true);
                    firebase
                        .auth()
                        .signInWithCredential(credential)
                        .then(() => {
                            setLoading(false)
                        })
                        .catch(function (error) {
                            setLoading(false)
                            Alert.alert(error.message)
                        })
                } else {
                    Alert.alert("Usuario ya está logueado")
                }
            });
    }
      
    function isUserEqual(googleUser, firebaseUser) {
        if (firebaseUser) {
            let providerData = firebaseUser.providerData
            for (let i = 0; i < providerData.length; i++) {
                if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
                    providerData[i].uid === googleUser.getBasicProfile().getId()) {
                    return true
                }
            }
        }
        return false
    }

    const doLogin = async() => {
        if(!validateData()) {
            return;
        }

        setLoading(true);
        const result = await loginWithEmailAndPassword(formData.email, formData.password);
        setLoading(false);

        if(!result.statusResponse) {
            setErrorEmail(result.error);
            setErrorPassword(result.error);
            return;
        }

        navigation.navigate("account");
    }

    const validateData = () => {
        setErrorEmail("");
        setErrorPassword("");
        let isValid = true;

        if(!validateEmail(formData.email)) {
            setErrorEmail("Debes ingresar un e-mail válido.");
            isValid = false;
        }

        if(isEmpty(formData.password)) {
            setErrorPassword("Debes ingresar tu contraseña.");
            isValid = false;
        }

        return isValid;
    }

    return (
        <View style = {styles.container}>
            <Input
                placeholder = "Ingresa tu e-mail..."
                containerStyle = {styles.input}
                onChange = {(e) => onChange(e, "email")}
                keyboardType = "email-address"
                errorMessage = {errorEmail}
                defaultValue = {formData.email}
            />
            <Input
                placeholder = "Ingresa tu contraseña..."
                containerStyle = {styles.input}
                password = {true}
                secureTextEntry = {!showPassword}
                onChange = {(e) => onChange(e, "password")}
                errorMessage = {errorPassword}
                defaultValue = {formData.password}
                rightIcon = {
                    <Icon
                        type = "material-community"
                        name = { showPassword ? "eye-off-outline" : "eye-outline"}
                        iconStyle = {styles.icon}
                        onPress = {() => setShowPassword(!showPassword)}
                    />
                }
            />
            <Button
                title = "Iniciar Sesión"
                containerStyle = {styles.btnContainer}
                buttonStyle = {styles.btn}
                onPress = {() => doLogin()}
            />
            <Button
                title = "Iniciar Sesión con Google"
                containerStyle = {styles.btnContainer}
                buttonStyle = {styles.btnGoogle}
                onPress = {googleSignInAsync}
                icon = {
                    <Icon
                        name="google"
                        type="material-community"
                        marginRight={10}
                        size={20}
                        color="#fff"
                    />
                }
            />
            <Loading isVisible={loading} text="Iniciando Sesión..."/>
        </View>
    )
}

const defaultFormValues = () => {
    return { email: "", password: "" }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30
    },
    input: {
        width: "100%"
    },
    btnContainer: {
        marginTop: 20,
        width: "95%",
        alignSelf: "center"
    },
    btn: {
        backgroundColor: "#442484"
    },
    icon: {
        color: "#c1c1c1"
    },
    btnGoogle: {
        backgroundColor: "#EA4335"
    }
})
