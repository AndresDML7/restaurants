import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { isUsserLogged } from '../../utils/actions';
import Loading from '../../components/Loading'
import UserGuest from './UserGuest';
import UserLogged from './UserLogged';

export default function Account() {

    const [login, setLogin] = useState(null);

    useEffect(() => {
        setLogin(isUsserLogged());
    }, [])

    if(login == null) {
        return <Loading isVisible={true} text="Cargando..."/>
    }

    return login ? <UserLogged/> : <UserGuest/>
}

const styles = StyleSheet.create({});
