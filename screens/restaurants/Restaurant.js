import React, { useState, useEffect, useCallback, useRef } from 'react';
import { isEmpty, map } from 'lodash';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Input, ListItem, Rating } from 'react-native-elements';
import { useFocusEffect } from '@react-navigation/native'
import firebase from 'firebase/app'
import Toast from 'react-native-easy-toast'

import { addDocumentWithoutId, getCurrentUser, getDocumentById, getIsFavorite, deleteFavorite, 
    setNotificationMessage, sendPushNotification, getUsersFavorite } from '../../utils/actions';
import { callNumber, formatPhone, sendEmail, sendWhatsApp } from '../../utils/helpers';
import CarouselImages from '../../components/CarouselImages';
import Loading from '../../components/Loading';
import MapRestaurant from '../../components/restaurants/MapRestaurant';
import ListReviews from '../../components/restaurants/ListReviews';
import Modal from '../../components/Modal';

const widthScreen = Dimensions.get("window").width;

export default function Restaurant({ navigation, route}) {

    const {id, name} = route.params;
    const toastRef = useRef();

    const [restaurant, setRestaurant] = useState(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [userLogged, setUserLogged] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalNotification, setModalNotification] = useState(false);

    firebase.auth().onAuthStateChanged(user => {
        user ? setUserLogged(true) : setUserLogged(false)
        setCurrentUser(user)
    })

    navigation.setOptions({ title: name });

    useEffect(() => {
        (async() => {
            if(userLogged && restaurant) {
                const response = await getIsFavorite(restaurant.id);
                response.statusResponse && setIsFavorite(response.isFavorite);
            }
        })()
    }, [userLogged, restaurant])

    useFocusEffect(
        useCallback(() => {
            (async() => {
                const response = await getDocumentById("restaurants", id);
    
                if(response.statusResponse) {
                    setRestaurant(response.document);
                } else {
                    setRestaurant({});
                    Alert.alert("Ocurrió un error cargando el restaurante, intente más tarde.");
                }
            })()
        }, [])
    )

    if(!restaurant) {
        return <Loading isVisible={true} text="Cargando..."/>
    }

    const addFavorite = async() => {
        if(!userLogged) {
            toastRef.current.show("Para agregar el restaurante a favoritos, debes estar logueado.", 3000);
            return;
        }

        setLoading(true);
        const response = await addDocumentWithoutId("favorites", {
            idUser: getCurrentUser().uid, 
            idRestaurant: restaurant.id
        })
        setLoading(false);

        if(response.statusResponse) {
            setIsFavorite(true);
            toastRef.current.show("Restaurante añadido a favoritos.", 3000);
        } else {
            toastRef.current.show("No se pudo añadir el restaurante a favoritos, por favor intenta más tarde.", 3000);
        }
    }

    const removeFavorite = async() => {
        setLoading(true);
        const response = await deleteFavorite(restaurant.id);
        setLoading(false);

        if(response.statusResponse) {
            setIsFavorite(false);
            toastRef.current.show("Restaurante eliminado de favoritos.", 3000);
        } else {
            toastRef.current.show("No se pudo eliminar el restaurante de favoritos, por favor intenta más tarde.", 3000);
        }
    }

    return (
        <ScrollView style={styles.viewBody}>
            <CarouselImages
                images = {restaurant.images}
                height = {250}
                width = {widthScreen}
                activeSlide = {activeSlide}
                setActiveSlide = {setActiveSlide}
            />
            <View style={styles.viewFavorite}>
                <Icon
                    type="material-community"
                    name={ isFavorite ? "heart" : "heart-outline" }
                    onPress={ isFavorite ? removeFavorite : addFavorite }
                    color="#442484"
                    size={35}
                    underlayColor="transparent"
                />
            </View>
            <TitleRestaurant
                name={restaurant.name}
                description={restaurant.description}
                rating={restaurant.rating}
            />
            <RestaurantInfo
                name={restaurant.name}
                location={restaurant.location}
                address={restaurant.address}
                email={restaurant.email}
                phone={formatPhone(restaurant.callingCode, restaurant.phone)}
                currentUser={currentUser}
                setModalNotification={setModalNotification}
            />
            <ListReviews
                navigation={navigation}
                idRestaurant={restaurant.id}
            />
            <SendMessage
                modalNotification={modalNotification}
                setModalNotification={setModalNotification}
                setLoading={setLoading}
                restaurant={restaurant}
            />
            <Toast ref={toastRef} position="center" opacity={0.9} />
            <Loading isVisible={loading} text="Cargando..." />
        </ScrollView>
    )
}

function SendMessage({ modalNotification, setModalNotification, setLoading, restaurant }) {
    const [title, setTitle] = useState(null)
    const [errorTitle, setErrorTitle] = useState(null)
    const [message, setMessage] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const sendNotification = async() => {
        if(!validForm()) {
            return
        }

        setLoading(true)
        const userName = getCurrentUser().displayName ? getCurrentUser().displayName : "Anonimo"
        const theMessage = `${message}, sobre el restaurante: ${restaurant.name}.`

        const usersFavorite =  await getUsersFavorite(restaurant.id)
        
        if(!usersFavorite.statusResponse) {
            setLoading(false)
            Alert.alert("Error al obtener los usuarios que gustan del restaurante.")
            return
        }

        await Promise.all(
            map(usersFavorite.users, async(user) => {
                const messageNotification = setNotificationMessage(
                    user.token,
                    `${userName}, dijo: ${title}`,
                    theMessage,
                    { data: theMessage }
                )
        
                await sendPushNotification(messageNotification)
            })
        )

        setLoading(false)
        setTitle(null)
        setMessage(null)
        setModalNotification(false)
    }

    const validForm = () => {
        let isValid = true

        if(isEmpty(title)) {
            setErrorTitle("Debes ingresar un titulo a tu mensaje.")
            isValid = false
        }

        if(isEmpty(message)) {
            setErrorMessage("Debes ingresar un mensaje.")
            isValid = false
        }

        return isValid
    }

    return (
        <Modal
            isVisible={modalNotification}
            setVisible={setModalNotification}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.textModal}>Enviale un mensaje a los amantes de {restaurant.name}!</Text>
                <Input
                    placeholder="Tídulo del mensaje..."
                    onChangeText={(text) => setTitle(text)}
                    value={title}
                    errorMessage={errorTitle}
                />
                <Input
                    placeholder="Mensaje..."
                    multiline
                    inputStyle={styles.textArea}
                    onChangeText={(text) => setMessage(text)}
                    value={message}
                    errorMessage={errorMessage}
                />
                <Button
                    title="Enviar Mensjae"
                    buttonStyle={styles.btnSend}
                    containerStyle={styles.btnSendContainer}
                    onPress={sendNotification}
                />
            </View>
        </Modal>
    )
}

function RestaurantInfo({ name, location, address, email, phone, currentUser, setModalNotification }) {
    const listInfo = [
        { type: "address", text: address, iconLeft: "map-marker", iconRight: "message-text-outline" },
        { type: "phone", text: phone, iconLeft: "phone", iconRight: "whatsapp" },
        { type: "email", text: email, iconLeft: "at" }
    ]

    const actionLeft = (type) => {
        if(type == "phone") {
            callNumber(phone)
        } else if(type == "email") {
            if(currentUser) {
                sendEmail(email, "Interesado", `Hola, soy ${currentUser.displayName}, y estoy interesado en sus servicios.`)
            } else {
                sendEmail(email, "Interesado", "Hola, estoy interesado en sus servicios.")
            }
        }
    }

    const actionRight = (type) => {
        if(type == "phone") {
            if(currentUser) {
                sendWhatsApp(phone, `Hola, soy ${currentUser.displayName}, y estoy interesado en sus servicios.`)
            } else {
                sendWhatsApp(phone, "Hola, estoy interesado en sus servicios.")
            }
        } else if(type == "address") {
            setModalNotification(true)

        }
    }

    return(
        <View style={styles.viewRestaurantInfo}>
            <Text style={styles.restaurantInfoTitle}>
                Información sobre el restaurante
            </Text>
            <MapRestaurant
                location={location}
                name={name}
                height={150}
            />
            {
                map(listInfo, (item, index) => (
                    <ListItem
                        key={index}
                        style={styles.containerListItem}
                    >
                        <Icon
                            type="material-community"
                            name={item.iconLeft}
                            color="#442484"
                            onPress={() => actionLeft(item.type)}
                        />
                        <ListItem.Content>
                            <ListItem.Title>{item.text}</ListItem.Title>
                        </ListItem.Content>
                        {
                            item.iconRight && (
                                <Icon
                                    type="material-community"
                                    name={item.iconRight}
                                    color="#442484"
                                    onPress={() => actionRight(item.type)}
                                />
                            )
                        }
                    </ListItem>
                ))
            }
        </View>
    )
}

function TitleRestaurant({ name, description, rating }) {
    return(
        <View style={styles.viewRestaurantTitle}>
            <View style={styles.viewRestaurantContainer}>
                <Text style={styles.nameRestaurant}>{name}</Text>
                <Rating
                    style={styles.rating}
                    imageSize={20}
                    readonly
                    startingValue={parseFloat(rating)}
                />
            </View>
            <Text style={styles.descriptionRestaurant}>{description}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    viewBody: {
        flex: 1,
        backgroundColor: "#fff"
    },
    viewRestaurantTitle: {
        padding: 15
    },
    viewRestaurantContainer: {
        flexDirection: "row"
    },
    descriptionRestaurant: {
        marginTop: 8,
        color: "gray",
        textAlign: "justify"
    },
    rating: {
        position: "absolute",
        right: 0
    },
    nameRestaurant: {
        fontWeight: "bold"
    },
    viewRestaurantInfo: {
        margin: 15,
        marginTop: 25
    },
    restaurantInfoTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15
    },
    containerListItem: {
        borderBottomColor: "#a376c7",
        borderBottomWidth: 1
    },
    viewFavorite: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#fff",
        borderBottomLeftRadius: 100,
        padding: 5,
        paddingLeft: 15
    },
    textArea: {
        height: 50,
        paddingHorizontal: 10
    },
    btnSend: {
        backgroundColor: "#442484"
    },
    btnSendContainer: {
        width: "95%"
    },
    textModal: {
        color: "#000",
        fontSize: 16,
        fontWeight: "bold"
    },
    modalContainer: {
        justifyContent: "center",
        alignItems: "center"
    }
})
