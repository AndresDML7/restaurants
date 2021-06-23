import React, { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Button, Input, Icon } from 'react-native-elements'
import { validateEmail } from '../../utils/helpers'
import { sendEmailResetPassword } from '../../utils/actions'
import Loading from '../../components/Loading'

export default function RecoverPassword({ navigation }) {

    const [email, setEmail] = useState(null)
    const [errorEmail, setErrorEmail] = useState(null)
    const [loading, setLoading] = useState(false)

    const onSubmit = async() => {
        if(!validateData()) {
            return
        }

        setLoading(true)
        const result = await sendEmailResetPassword(email)
        setLoading(false)

        if(!result.statusResponse) {
            Alert.alert("Error", "Este correo no está relacionado a ningún usuario.")
            return
        }

        Alert.alert("Confirmación", "Se le ha enviado un email con las instrucciones para cambiar su contraseña.")
        navigation.navigate("account", { screen: "login" })

    }

    const validateData = () => {
        setErrorEmail(null)
        let isValid = true

        if(!validateEmail(email)) {
            setErrorEmail("Debes ingresar un email válido.")
            isValid=false
        }

        return isValid
    }

    return (
        <View style={styles.formContainer}>
            <Input
                placeholder="Ingresa tu email..."
                containerStyle={styles.inputForm}
                onChange={(e) => setEmail(e.nativeEvent.text)}
                defaultValue={email}
                errorMessage={errorEmail}
                keyboardType="email-address"
                rightIcon={
                    <Icon
                        type="material-community"
                        name="at"
                        iconStyle={styles.icon}
                    />
                }
            />
            <Button
                title="Recuperar Contraseña"
                containerStyle={styles.btnContainer}
                buttonStyle={styles.btnRecover}
                onPress={onSubmit}
            />
            <Loading isVisible={loading} text="Recuperando contraseña..." />
        </View>
    )
}

const styles = StyleSheet.create({
    formContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30
    },
    inputForm: {
        width: "90%"
    },
    btnContainer: {
        marginTop: 20,
        width:"85%",
        alignSelf: "center"
    },
    btnRecover: {
        backgroundColor: "#442484"
    },
    icon: {
        color: "#c1c1c1"
    }
})
