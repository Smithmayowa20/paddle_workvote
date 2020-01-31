import React, {useState, useEffect, useCallback, useReducer} from "react";
import PropTypes from "prop-types";
import Head from 'next/head'
import tinycolor from "tinycolor2"
import queryString from "query-string";
import cookie from "cookie";
import {
  CardElement,
  injectStripe,
  Elements,
  StripeProvider,
  CardNumberElement,
  CardExpiryElement,
  CardCVCElement,
} from "react-stripe-elements";
import fetch from 'isomorphic-unfetch'
import dateformat from 'dateformat'
import ReactModal from "react-modal";
import {useModal, ModalProvider} from "react-modal-hook";
import "../components/scss/index.scss";

const Flex = ({children, direction = "default", justify, align, alignSelf, className = "flex", style = {}, flex}) =>
  <div className={className + " flex-" + direction} style={{
    justifyContent: justify,
    alignItems: align,
    flex: flex,
    alignSelf: alignSelf,
    ...style,
  }}>
    {children}
  </div>

const Container = ({style = {}, ...props}) =>
  <Flex
    style={{
      "flex": 1,
      margin: "auto",
      ...style,
    }}
    {...props} />

const Heading1 = ({text, align = "left"}) =>
  <h1 style={{textAlign: align}}>
    {text}
  </h1>

const Heading3 = ({text, align = "left", style = {}}) =>
  <h3 style={{
    textAlign: align,
    ...style
  }}>
    {text}
  </h3>

const Text = ({children, align = "center", secondary, size, style = {}, color, href}) =>
  <p style={{
    textAlign: align,
    fontSize: size,
    color: color || (secondary ? "rgba(0, 0, 0, 0.54)" : "#000"),
    ...style,
  }}>
    {href ?
      <a style={{color}} href={href}>{children}</a> :
      children
    }
  </p>

const Card = ({children, accentColor, style = {}, padding = 10}) =>
  <div
    className="card"
    style={{
      borderTop: `9px ${accentColor} solid`,
      width: 211,
      margin: 10,
      boxShadow: "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
      borderRadius: 10,
      fontSize: 16,
      minHeight: 200,
      padding: padding,
      ...style,
    }}
  >
    {children}
  </div>

const Button = ({
                  color, filled, text, onClick = () => {
  }
                }) => {
  const backgroundColor = filled ? color : "white";
  const hoverColor = filled
    ? tinycolor(backgroundColor)
      .darken()
      .toString()
    : tinycolor(color)
      .setAlpha(0.2)
      .toString();

  return (
    <div>
      <button
        onClick={onClick}
        style={{
          color: filled ? "white" : color,
          border: `1px ${color} solid`,
          borderRadius: 30,
          width: "100%",
          minWidth: 128,
          height: 30,
        }}
      >
        {text}
      </button>
      <style jsx>{`
        button {
          background-color: ${backgroundColor}
        }
        button:hover {
          background-color: ${hoverColor};
        }
      `}</style>
    </div>
  )
}

const selectedProps = (props) => ({
  ...props,
  subtitle: "",
  accentColor: "rgb(83 166 251)",
  buttonText: "Selected",
  buttonFilled: true,
  notable: true,
})

const unSelectedProps = (props) => ({
  ...props,
  subtitle: "",
  buttonFilled: false,
  buttonText: "Change Plan",
  features: props.features.slice(0, 2),
  accentColor: "gray",
  textColor: "gray",
  buttonColor: "black",
})

const subscribedProps = (props) => ({
  ...props,
  subtitle: "",
  features: props.features.slice(0, 2),
  buttonText: "Active",
  buttonFilled: true,
})


const SelectablePriceCard = ({name, selected, subscribed, ...props}) => {
  if (!subscribed && !selected) {
    return <PriceCard {...props} />
  } else if (subscribed === name && (selected === name || !selected)) {
    return <PriceCard {...subscribedProps(selectedProps(props))} />
  } else if (subscribed === name) {
    return <PriceCard {...subscribedProps(unSelectedProps(props))} />
  } else if (selected === name) {
    return <PriceCard {...selectedProps(props)} />
  } else {
    return <PriceCard {...unSelectedProps(props)} />
  }
}

const PriceCard = ({
                     title,
                     subtitle,
                     buttonText,
                     textColor = "black",
                     buttonColor,
                     accentColor,
                     features,
                     price,
                     buttonFilled = true,
                     onClick,
                     notable,
                   }) => (
  <Card accentColor={accentColor}>
    <Heading3 style={{margin: 0, color: textColor}} text={title} align="center"/>
    {subtitle && (
      <Text style={{margin: '6px 0', color: '#676767', fontSize: 14, fontWeight: 'bold'}} secondary align="center">
        {subtitle}
      </Text>
    )}
    <div>
      <Flex direction="row" justify="center" align="center">
        <Text
          style={{marginTop: 5, marginBottom: 0, fontSize: 24, color: textColor, fontWeight: 'bold'}}
          align="center"
        >
          ${price}<span style={{fontSize: 14, color: textColor, fontWeight: 'bold'}}>/mo</span>
        </Text>
      </Flex>
      <div style={{margin: 10}}>
        {features.map(feature =>
          <Text style={{marginTop: 16, color: textColor, fontSize: 14, fontWeight: 'bold'}} variant="subtitle1" align="center" key={feature}>
            {feature}
          </Text>
        )}
        {features.length === 2 && notable ? <br/> : null}
      </div>
    </div>
    <Button
      onClick={onClick}
      color={buttonColor || accentColor}
      filled={buttonFilled}
      text={buttonText}/>
  </Card>
);

const addToSlackUrl = "https://slack.com/oauth/authorize?client_id=856261207136.869687499095&scope=commands"

const signUpWithSlack = (plan) => {
  window.location = addToSlackUrl + "&redirect_uri=" + encodeURI("https://paddle.smithmayowa20.now.sh/oauth?selected=" + plan)
}

const paddleSignUp = (plan, setSubscribed, setHasCard, onSuccess, planName, price) => {
	Paddle.Setup({ vendor: 106983 })
    Paddle.Checkout.open({ product: 580384 })
	setSubscribed(plan)
    setHasCard(true)
    onSuccess()
}

const selectOrAdd = (loggedIn, setSelected) => plan => () => {
  if (loggedIn) {
    setSelected(plan)
  } else {
    signUpWithSlack(plan)
    /* Paddle.Setup({ vendor: 106983 })
    Paddle.Checkout.open({ product: 580384 }) */
  }
}

const Pricing = ({selected, setSelected, subscribed, loggedIn}) => {
  const select = selectOrAdd(loggedIn, setSelected)
  return (
    <div className="pricing">
      <SelectablePriceCard
        selected={selected}
        subscribed={subscribed}
        name="plan_GWEUqaZ2fT6emr"
        price={0}
        features={["Non-Commercial Use", "25 polls a month"]}
        accentColor="#59A5FF"
        buttonText="Sign Up"
        title="Personal"
        onClick={select("plan_GWEUqaZ2fT6emr")}/>
      <SelectablePriceCard
        selected={selected}
        subscribed={subscribed}
        name="plan_GGmZYYHK0DyAPm"
        price={15}
        features={["50 polls a month", "Unlimited Users", "30 day free trial"]}
        buttonFilled={true}
        accentColor="#FF7A00"
        subtitle="Most Popular"
        buttonText="Try Now"
        title="Basic"
        onClick={select("plan_GGmZYYHK0DyAPm")}/>
      <SelectablePriceCard
        selected={selected}
        subscribed={subscribed}
        name="plan_GGmZKAIUMfOt8n"
        price={25}
        features={["100 polls a month", "Unlimited Users"]}
        accentColor="#006CEA"
        buttonVariant="contained"
        buttonText="Sign Up"
        title="Premium"
        onClick={select("plan_GGmZKAIUMfOt8n")}/>
      <SelectablePriceCard
        selected={selected}
        subscribed={subscribed}
        name="plan_GGmZWkEnZ0DRWt"
        price={50}
        features={["Unlimited polls a month", "Unlimited Users"]}
        accentColor="#004AA0"
        buttonText="Sign Up"
        title="Enterprise"
        onClick={select("plan_GGmZWkEnZ0DRWt")}/>
    </div>
  )
};

const LoggedInActions = ({team}) =>
  <Flex style={{backgroundColor: "#0099FF"}} direction="row" justify="flex-end">
    <Flex style={{paddingRight: 30, minWidth: 200}} direction="row" alignSelf="flex-end" justify="space-around" align="center">
      <Flex style={{paddingRight: 20}} align="center">
        <img src={team.image_34} style={{height: 34, paddingRight: 5}}/>
        <Text color="white" size={16}>{team.name}</Text>
      </Flex>
      <Text href="/logout" color="white" size={16}>Logout</Text>
    </Flex>
  </Flex>


const loginUrl = "https://slack.com/oauth/authorize?scope=identity.basic,identity.team&client_id=856261207136.869687499095"

const Header = ({team}) => {

  if (team) {
    return (
      <LoggedInActions team={team}/>
    )
  }

  return (
    <Flex style={{backgroundColor: "#0099FF", marginBottom: 0, alignItems: 'center', justifyContent: 'space-between', padding: '0 45px 0 16px'}} direction="row" justify="left">
      <Flex direction="row" justify="left" className="workvote">
        <Text href="https://forms.gle/VGoNGnikEiqs6rD86" color="white" size={24} style={{marginTop: '15px'}}>WorkVote</Text>
      </Flex>
      <Flex direction="row" justify="left" className="login">
        <Text href={loginUrl} color="white" size={14}>Login</Text>
      </Flex>
    </Flex>
  )
}


const PlanDescription = ({price, planName, children}) =>
  <div style={{height: 130}}>
    <Flex justify="center" align="center" direction="column">
      <div style={{
        borderRadius: "100%",
        marginTop: -40,
        marginBottom: 0,
        backgroundColor: "white",
        padding: 10,
        border: "3px solid #fff",
        boxShadow: "0 0 0 2px rgba(0,0,0,.18), 0 2px 2px 5px rgba(0,0,0,.08)"
      }}>
        <img style={{width: 50, height: 50}} src="/static/logo.png"/>
      </div>
      <Text style={{fontWeight: "bold"}}>WorkVote</Text>
      <Text secondary style={{margin: 0}}>{planName} - ${price}/month</Text>
      {children}
    </Flex>
  </div>

const submitReducer = (state, action) => {
  switch (action.type) {
    case "SUBMIT": {
      return {status: "SUBMITTING"}
    }
    case "SUCCESS": {
      return {
        status: "SUBMITTED",
        payload: action.payload,
      }
    }
    case "ERROR": {
      return {
        status: "SUBMITTED",
        error: action.error,
      }
    }
    default: {
      throw new Error();
    }
  }
}

const useSubmit = (f, deps = []) => {
  const submitf = useCallback(f, deps);
  const [state, dispatch] = useReducer(submitReducer, {status: undefined});
  const onSubmit = async () => {
    dispatch({type: "SUBMIT"});
    try {
      const payload = await submitf();
      dispatch({
        type: "SUCCESS",
        payload,
      })
    } catch (error) {
      dispatch({
        type: "ERROR",
        error,
      })
    }
  }
  return [state, onSubmit]
}

const useSubmitButton = (initialText, f, deps = []) => {
  const [state, onSubmit] = useSubmit(f, deps);

  const isSubmitting = state.status === "SUBMITTING"
  const text = isSubmitting ? "submitting" : initialText;
  return {
    onSubmit,
    onClick: onSubmit,
    disabled: isSubmitting,
    text,
  }
}

const useInput = (initialState) => {
  const [value, setValue] = useState(initialState);
  const onChange = (e) => setValue(e.target.value)
  return {
    value,
    onChange,
  }
}

const CheckoutForm = injectStripe(({price, planName, stripe, plan, setSubscribed, setHasCard, onSuccess}) => {
  const name = useInput("");
  const email = useInput("");

  const submitProps = useSubmitButton("Subscribe", async () => {
    //const {token} = await stripe.createToken({name: name.value});
    const token = "tok_visa";

    if (token) {
      await fetch("/subscriptions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan,
          email: email.value,
          //id: token.id,
          id: token
        })

      })

      setSubscribed(plan)
      setHasCard(true)
      onSuccess()
    }

  }, [name.value, email.value, stripe, plan])

  return (
    <Card accentColor="rgb(83 166 251)" style={{width: 253, height: 415, backgroundColor: "#fff", marginTop: 45, marginBottom: 35}} padding={0}>
      <PlanDescription price={price} planName={planName}/>
      <div style={{padding: 20, paddingTop: 10}}>
        <fieldset style={{padding: 5}}>
          <label>Email</label>
          <Flex align="center">
            <input
              {...email}
              id="email"
              type="email"
              placeholder="janedoe@example.com"
              required=""
              autoComplete="email"/>
          </Flex>
        </fieldset>
        <fieldset style={{padding: 5}}>
          <label>Name On Card</label>
          <Flex align="center">
            <input
              {...name}
              id="name"
              type="text"
              placeholder="Jane Doe"
              required=""/>
          </Flex>
        </fieldset>
        <fieldset style={{padding: 5}}>
          <label>Card Number</label>
          <CardNumberElement/>
        </fieldset>
        <fieldset style={{padding: 5}}>
          <Flex>
            <div style={{width: "50%"}}>
              <label>Exp</label>
              <CardExpiryElement/>
            </div>
            <div style={{width: "50%"}}>
              <label>CVC</label>
              <CardCVCElement/>
            </div>
          </Flex>
        </fieldset>
        <Flex style={{height: 50}} direction="column" justify="flex-end">
          <Button
            color="rgb(83 166 251)"

            {...submitProps} />
        </Flex>
      </div>
    </Card>
  )
})

const Stripe = ({price, planName, plan, setSubscribed, setHasCard, onSuccess}) => {
  if (!process.browser) {
    return null;
  }
  return (
    <StripeProvider apiKey="pk_live_a6qh8FdsITIRlQOf4U7CvyjD">
      <Elements>
        <CheckoutForm
          onSuccess={onSuccess}
          setHasCard={setHasCard}
          price={price}
          planName={planName}
          plan={plan}
          setSubscribed={setSubscribed}/>
      </Elements>
    </StripeProvider>
  )
}

if (process.browser) {
  window.devtools = {}
}

const useDevState = (name, initialState) => {
  const [value, setValue] = useState(initialState);
  if (process.browser) {
    window.devtools[name] = setValue;
  }
  return [value, setValue]
}

const useDevTools = () => {
  useEffect(() => {
    console.log(`The following dev tools are available: ${Object.keys(window.devtools).join(", ")}`)
  }, [])
}

const priceBySelected = {
  "plan_GWEUqaZ2fT6emr": 0,
  "plan_GGmZYYHK0DyAPm": 15,
  "plan_GGmZKAIUMfOt8n": 25,
  "plan_GGmZWkEnZ0DRWt": 50,
}

const nameByPlan = {
  "plan_GWEUqaZ2fT6emr": "Personal",
  "plan_GGmZYYHK0DyAPm": "Basic",
  "plan_GGmZKAIUMfOt8n": "Premium",
  "plan_GGmZWkEnZ0DRWt": "Enterprise",
}

const SubscriptionButton = ({subscribed, selected, setSubscribed}) => {
  const cancelSubProps = useSubmitButton("Cancel", async () => {
    await fetch("/cancel_subscription", {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    })
    setSubscribed(null)

  }, [])

  const changeSubProps = useSubmitButton("Change Subscription", async () => {
    await fetch("/change_subscription", {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan: selected
      })
    })

    setSubscribed(selected)
  }, [selected])

  if (subscribed === selected || subscribed && !selected) {
    return (
      <Button
        color="rgb(251, 83, 83)"
        {...cancelSubProps} />
    )
  }
  else {
    return (
      <Button
        color="rgb(83, 166, 251)"
        {...changeSubProps} />
    )
  }
}

const ActiveSubscription = ({subscribed, selected, subscription, setSubscribed}) => {
  const style = {
    width: 253,
    height: 225,
    backgroundColor: "#fff",
    marginTop: 150,
    marginBottom: 120
  };

  const currentShown = selected || subscribed;
  const planName = nameByPlan[currentShown];
  const price = priceBySelected[currentShown]

  const nextChargeDate = subscription && subscription.current_period_end && dateformat(new Date(subscription.current_period_end * 1000), "mmmm dS")

  return (
    <Card style={style} accentColor="rgb(83 166 251)" padding={0}>
      <div style={{padding: 20}}>

        <PlanDescription price={price} planName={planName}>
          {price > 0
            ? <Text size={12} style={{padding: 0, margin: 0}} secondary>{nextChargeDate && `Next Charge ${nextChargeDate}`} </Text>
            : <Text size={12} style={{padding: 0, margin: 0}} secondary>Non-Commercial Use</Text>}
        </PlanDescription>
        <Flex style={{height: 55}} direction="column" justify="flex-end">
          <SubscriptionButton
            setSubscribed={setSubscribed}
            subscribed={subscribed}
            selected={selected}/>
        </Flex>
      </div>
    </Card>
  )
}

const SecondaryPanel = ({ selected, subscribed, subscription, setSubscribed, hasCard, setHasCard, onSuccess }) => {

  const currentShown = selected || subscribed;
  const planName = nameByPlan[currentShown];
  const price = priceBySelected[currentShown]

  if (!subscribed && !selected) {
    return '';
  } else if (hasCard || selected === "plan_GWEUqaZ2fT6emr" || (subscribed === "plan_GWEUqaZ2fT6emr" && !selected)) {
    return (
      <ActiveSubscription
        hasCard={hasCard}
        subscription={subscription}
        subscribed={subscribed}
        selected={selected}
        setSubscribed={setSubscribed} />
    )
  } else {
    return (
      paddleSignUp(plan, setSubscribed, setHasCard, onSuccess, planName, price)
      /* <Stripe
        onSuccess={onSuccess}
        hasCard={hasCard}
        setHasCard={setHasCard}
        setSubscribed={setSubscribed}
        planName={planName}
        price={price}
        plan={currentShown} /> */
    )
  }
}

const titleCase = (str) => str && str[0].toUpperCase() + str.substring(1);

const AddToSlack = () =>
  <a href="https://slack.com/oauth/authorize?client_id=856261207136.869687499095&scope=commands" className="add">
    Add to Slack <img style={{width: 18, height: 18}} src="/static/add.png" className="image"/>
  </a>


const CongratsModal = ({team, onClose}) => {
  return (
    <div style={{display: "flex", flexDirection: "column"}}>
      <div style={{backgroundColor: "rgb(83, 166, 251)", color: "white", padding: 20, borderRadius: "5px 5px 0 0"}}>
        <h2 style={{margin: 0, fontSize: 36}}>WorkVote Installed Successfully!</h2>
      </div>
      <div style={{padding: 20}}>
        <p>Thanks for trying out workvote. You can now make polls in {team && `the ${team.name} `} Slack. To get started try posting this poll below.</p>
        <pre style={{backgroundColor: "#f6f8fa", padding: 10}}>
          <code>
            /poll "Should we start using polls?" "Yes" "No"
          </code>
        </pre>
        <Container direction="column" justify="center">
          <div style={{width: 130, alignSelf: "center"}}>
            <Button onClick={onClose} text="Close" color="rgb(83, 166, 251)"/>
          </div>
        </Container>
      </div>
    </div>
  )
}

const useCongratsModel = ({user}) => {

  const changeLocation = useCallback(() => {
    history.replaceState({}, "WorkVote", "/")
  })


  const [showModal, hideModal] = useModal(() => (
    <ReactModal
      onRequestClose={() => {
        hideModal();
        changeLocation()
      }}
      className="congrats-modal"
      overlayClassName="overlay"
      isOpen
    >
      <CongratsModal
        onClose={() => {
          hideModal();
          changeLocation()
        }}
        team={user.slack && user.slack.team}/>
    </ReactModal>
  ));
  return [showModal, hideModal]
}


// Need to actually make there be pictures and stuff. Silly slack requirements.

const useInfoModal = ({user}) => {

  const [showModal, hideModal] = useModal(() => (
    <ReactModal
      onRequestClose={() => {
        hideModal()
      }}
      className="info-modal"
      overlayClassName="overlay"
      isOpen
    >
      <div style={{height: "100%", overflowY: "scroll"}}>
        <h3>How To Use:</h3>
        <p>Once you have workvote installed you can see make a poll using the <code>/poll</code> command.</p>
        <blockquote>
          /poll "Favorite food?" "Pizza" "Ice Cream" "Other"
        </blockquote>
        <img style={{width: 700}} src="/static/img2.png"/>
      </div>
    </ReactModal>
  ));
  return [showModal, hideModal]
}

const defaultPrevented = (f) => (e) => {
  e.preventDefault();
  f();
}

const App = ({user, initialSelection, token}) => {

  const [showCongratsModal, _hideCongratsModal] = useCongratsModel({user});
  const [showInfoModal, _hideInfoModal] = useInfoModal({user});

  useEffect(() => {
    if (initialSelection === "plan_GWEUqaZ2fT6emr") {
      showCongratsModal();
    }
  }, [])

  const [hasCard, setHasCard] = useDevState("setHasCard", user.hasCard);
  const [subscribed, setSubscribed] = useDevState("setSubscribed", user.subscription && user.subscription.plan && user.subscription.plan.id);
  const [selected, setSelected] = useDevState("setSelected", initialSelection);
  useDevTools();
  return (
    <>
      <Head>
        <title>WorkVote - Slack polls made easy</title>
        <link rel="icon" type="image/png" href="/static/favicon.png" sizes="196x196"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <script src="https://js.stripe.com/v3/"></script>
        <script src="https://cdn.paddle.com/paddle/paddle.js"></script>
        <script type="text/javascript">
        </script>
      </Head>
      <Header team={user.slack && user.slack.team}/>
      <div className="rect-blue">
        <Flex direction="row" justify="center">
          <Flex direction="column" justify="center">
            <Flex className="next-to" direction="row" align="baseline" justify="center">
              <Heading1 align="center" text="Create polls in Slack"/>
            </Flex>
            <Flex className="next-to" direction="row" align="center" justify="center">
              <Text color="rgba(255, 255, 255, 0.71)" className="detail" style={{width: 500, height: 44, marginTop: 0, marginBottom: '22px', fontSize: '18px', fontWeight: 'bold'}}>
                Make and take polls right in Slack. Gather feedback or make decisions without needing to schedule a meeting.
              </Text>
            </Flex>
            <Flex className="next-to" direction="row" justify="center">
              <text className="slack">
                <AddToSlack/>
              </text>
            </Flex>
            <div className="screenshot"></div>

            <div className="secondary-panel">
              <SecondaryPanel
                onSuccess={showCongratsModal}
                setHasCard={setHasCard}
                hasCard={hasCard}
                setSubscribed={setSubscribed}
                subscription={user.subscription}
                selected={selected}
                subscribed={subscribed}/>
            </div>

            {!user.loggedIn && <div>
              <h3 className="how-title">How it works</h3>
              <div className="how-it-works">
                <img className="slack-screen" src="/static/img2.png"/>
                <div className="how-text">
                  <p>Once you have workvote installed you can view or make a poll using the/poll command</p>
                  <div className="line"></div>
                  <p>To make an anonymous poll just add anonymous to the end your poll. Names will not show up when people vote.</p>
                </div>
              </div>
            </div>
            }
          </Flex>
        </Flex>
      </div>

      <h3 className="pricing-title">Pricing</h3>
      <Pricing
        subscribed={subscribed}
        selected={selected}
        setSelected={setSelected}
        loggedIn={user.loggedIn}/>

      <div className="footer">
        <span className="copyright">@ 2019 WorkVote</span>
      </div>
    </>
  )
};

const Main = ({user, initialSelection, token}) =>
  <ModalProvider>
    <App user={user} initialSelection={initialSelection} token={token}/>
  </ModalProvider>

Main.getInitialProps = async ({req, query: {selected}}) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host
  const protocol = host.startsWith("localhost") ? "http" : "https"
  try {
    const res = await fetch(`${protocol}://${host}/user`, {
      credentials: "include", // polyfill only supports include for cookies
      headers: {
        cookie: req.headers.cookie // Stupid hack around server side rendering stuff
      }
    });
    const user = await res.json();
    return {user, initialSelection: selected};

  } catch (e) {
    return {user: {loggedIn: false}, initialSelection: selected, token: slack_access_token}
  }
};

export default Main
