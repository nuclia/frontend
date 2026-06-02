#!/usr/bin/env bash
set -Ex

function apply_path {
    jsonFile=/dist/assets/deployment/app-config.json

    echo "Check that we have SITE_KEY vars"
    [[ -n "$SITE_KEY" ]]
    echo "Check that we have APP_NAME vars"
    [[ -n "$APP_NAME" ]]
    echo "Check that we have API_ORIGIN vars"
    [[ -n "$API_ORIGIN" ]]
    echo "Check that we have CDN vars"
    [[ -n "$CDN" ]]
    echo "Check that we have SENTRY_ENV vars"
    [[ -n "$SENTRY_ENV" ]]
    echo "Check that we have SENTRY_URL vars"
    [[ -n "$SENTRY_URL" ]]
    echo "Check that we have STF_VERSION vars"
    [[ -n "$STF_VERSION" ]]
    echo "Check that we have SAML_ENABLED vars"
    [[ -n "$SAML_ENABLED" ]]
    echo "Check that we have STF_DOCKER_CONFIG_NO_STRIPE vars"
    [[ -n "$STF_DOCKER_CONFIG_NO_STRIPE" ]]
    echo "Check that we have oauth params vars"
    [[ -n "$STF_DOCKER_CONFIG_OAUTH_CLIENT_ID" ]]

    echo "Configuring SITE_KEY vars"
    sed -i "s#STF_DOCKER_CONFIG_SITE_KEY#${SITE_KEY}#g" $jsonFile

    echo "Configuring APP_NAME vars"
    sed -i "s#STF_DOCKER_CONFIG_APP_NAME#${APP_NAME}#g" $jsonFile

    echo "Configuring API_ORIGIN vars"
    sed -i "s#STF_DOCKER_API_ORIGIN#${API_ORIGIN}#g" $jsonFile

    echo "Configuring CDN vars"
    sed -i "s#STF_DOCKER_CONFIG_CDN#${CDN}#g" $jsonFile

    echo "Configuring SENTRY_ENV vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_ENV#${SENTRY_ENV}#g" $jsonFile

    echo "Configuring SENTRY_URL vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_URL#${SENTRY_URL}#g" $jsonFile

    echo "Configuring STF_VERSION vars"
    sed -i "s#STF_DOCKER_CONFIG_VERSION#${STF_VERSION}#g" $jsonFile

    echo "Configuring SAML_ENABLED vars"
    sed -i "s#STF_DOCKER_CONFIG_SAML_ENABLED#${SAML_ENABLED}#g" $jsonFile

    echo "Configuring NO_STRIPE vars"
    sed -i "s#STF_DOCKER_CONFIG_NO_STRIPE#${NO_STRIPE}#g" $jsonFile

    echo "Configuring OAUTH params"
    sed -i "s#STF_DOCKER_CONFIG_OAUTH_CLIENT_ID#${OAUTH_CLIENT_ID}#g" $jsonFile

    echo "Configuring STF_DOCKER_CONFIG_GOOGLE_ANALYTICS vars"
    sed -i "s#STF_DOCKER_CONFIG_GOOGLE_ANALYTICS#${GOOGLE_ANALYTICS}#g" /dist/index.html

    echo "Check that we have BRAND_NAME vars"
    [[ -n "$BRAND_NAME" ]]
    sed -i "s#STF_DOCKER_CONFIG_BRAND_NAME#${BRAND_NAME}#g" $jsonFile

    echo "Check that we have ASSETS_PATH vars"
    [[ -n "$ASSETS_PATH" ]]

    echo "Using assets from '$ASSETS_PATH'";
    sed -i "s#STF_DOCKER_CONFIG_ASSETS_PATH#${ASSETS_PATH}#g" $jsonFile
    sed -i -E "s#assets\/(overrides|logos|favicon)#${ASSETS_PATH}/\1#g" /dist/index.html
}

# Should we monkey patch?
[[ -n "$APP_NAME" ]] && apply_path

echo "Configured"
