#!/usr/bin/env bash
set -Ex

function apply_path {
    jsonFile=/dist/assets/deployment/app-config.json

    echo "Check that we have API_PATH vars"
    test -n "$API_PATH"
    echo "Check that we have SITE_KEY vars"
    test -n "$SITE_KEY"
    echo "Check that we have APP_NAME vars"
    test -n "$APP_NAME"
    echo "Check that we have GANALYTICS vars"
    test -n "$GANALYTICS"
    echo "Check that we have SENTRY_ENV vars"
    test -n "$SENTRY_ENV"
    echo "Check that we have SENTRY_URL vars"
    test -n "$SENTRY_URL"
    echo "Check that we have STF_VERSION vars"
    test -n "$STF_VERSION"
    echo "Check that we have POSTHOG_HOST vars"
    test -n "$POSTHOG_HOST"
    echo "Check that we have POSTHOG_KEY vars"
    test -n "$POSTHOG_KEY"
    echo "Check that we have ALLOWED_HOST_REDIRECT vars"
    test -n "$ALLOWED_HOST_REDIRECT"
    echo "Check that we have SAML_ENABLED vars"
    test -n "$SAML_ENABLED"

    echo "Configuring API_PATH vars"
    sed -i "s#STF_DOCKER_CONFIG_API_PATH#${API_PATH}#g" $jsonFile

    echo "Configuring SITE_KEY vars"
    sed -i "s#STF_DOCKER_CONFIG_SITE_KEY#${SITE_KEY}#g" $jsonFile

    echo "Configuring APP_NAME vars"
    sed -i "s#STF_DOCKER_CONFIG_APP_NAME#${APP_NAME}#g" $jsonFile

    echo "Configuring GANALYTICS vars"
    sed -i "s#STF_DOCKER_CONFIG_GANALYTICS#${GANALYTICS}#g" $jsonFile

    echo "Configuring SENTRY_ENV vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_ENV#${SENTRY_ENV}#g" $jsonFile

    echo "Configuring SENTRY_URL vars"
    sed -i "s#STF_DOCKER_CONFIG_SENTRY_URL#${SENTRY_URL}#g" $jsonFile

    echo "Configuring STF_VERSION vars"
    sed -i "s#STF_DOCKER_CONFIG_VERSION#${STF_VERSION}#g" $jsonFile

    echo "Configuring POSTHOG_HOST vars"
    sed -i "s#STF_DOCKER_CONFIG_POSTHOG_HOST#${POSTHOG_HOST}#g" $jsonFile

    echo "Configuring POSTHOG_KEY vars"
    sed -i "s#STF_DOCKER_CONFIG_POSTHOG_KEY#${POSTHOG_KEY}#g" $jsonFile

    echo "Configuring ALLOWED_HOST_REDIRECT vars"
    sed -i "s#STF_DOCKER_CONFIG_ALLOWED_HOST_REDIRECT#${ALLOWED_HOST_REDIRECT}#g" $jsonFile

    echo "Configuring SAML_ENABLED vars"
    sed -i "s#STF_DOCKER_CONFIG_SAML_ENABLED#${SAML_ENABLED}#g" $jsonFile

}

# Should we monkey patch?
test -n "$API_PATH" && apply_path

echo "Configured"
