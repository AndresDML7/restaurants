import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Divider } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import LoginForm from '../../components/account/LoginForm';

export default function Login() {

    return (
        <KeyboardAwareScrollView>
            <Image
                source = {require("../../assets/restaurant-logo.png")}
                resizeMode = "contain"
                style = {styles.image}
            />
            <View style = {styles.container}>
                <LoginForm/>
                <CreateAccount/>
                <RecoverPassword

                />
            </View>
            <Divider style = {styles.divider}/>
        </KeyboardAwareScrollView>
    )
}

function RecoverPassword() {
    const navigation = useNavigation()

    return (
        <Text style={styles.register} onPress={() => navigation.navigate("recover-password")}>
            ¿Olvidaste tu contraseña?{" "}
            <Text style={styles.bntRegister}>Recupérala</Text>
        </Text>
    )
}

function CreateAccount(props) {
    const navigation = useNavigation();
    
    return (
        <Text style = {styles.register} onPress = {() => navigation.navigate("register")}>
            ¿Aún no tienes una cuenta?{" "}
            <Text style = {styles.bntRegister}>Regístrate</Text>
        </Text>
    )
}

const styles = StyleSheet.create({
    image : {
        height: 150,
        width: "100%",
        marginBottom: 20
    },
    container: {
        marginHorizontal: 40
    },
    divider: {
        backgroundColor: "#442484",
        margin: 40
    },
    register: {
        marginTop: 15,
        marginHorizontal: 10,
        alignSelf: "center"
    },
    bntRegister: {
        color: "#442482",
        fontWeight: "bold"
    }
})
