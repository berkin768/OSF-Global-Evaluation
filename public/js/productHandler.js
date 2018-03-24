var app = angular.module('product', ['header']);

app.controller('colorController', function ($scope, productService) {
    //var product = productService.GetProduct()
    var product = productService.product()

    product.then(function (product) {

        var sizes = []

        for (var i = 0; i < product.image_groups.length; i++) {
            if (typeof product.image_groups[i].variation_value == 'undefined') {
                var size = product.image_groups[i].view_type
                size = size.replace(/\b\w/g, function (l) {
                    return l.toUpperCase()
                })
                sizes.push(size)
            }
        }

        //SOME PRODUCTS HAVENT GOT ANY VARIATION ATTRIBUTES
        if (typeof product.variation_attributes[0] != 'undefined' && typeof product.image_groups != 'undefined') {

            var colors = product.variation_attributes[0].values //PRODUCT'S COLORS

            $scope.colors = colors
            $scope.selectedColor = colors[0] //INITIALIZE SELECTED COLOR AS FIRST COLOR


            $scope.sizes = sizes
            $scope.selectedSize = sizes[0] //INITIALIZE SELECTED SIZE AS FIRST SIZE

            var colorType = $scope.selectedColor.value //FOR EXAMPLE EJ3
            var sizeType = $scope.selectedSize //FOR EXAMPLE LARGE

            productService.color = colorType
            productService.size = sizeType
            var images = getImages(product, colorType, sizeType)

            printImage(images)
        } else {
            $scope.sizes = sizes
            $scope.selectedSize = sizes[0] //INITIALIZE SELECTED SIZE AS FIRST SIZE

            var sizeType = $scope.selectedSize //FOR EXAMPLE LARGE
            productService.size = sizeType

            var images = getImages(product, undefined, sizeType)
            printImage(images)
        }
    })

    //WHEN COLOR SELECTED FROM DROPDOWN LIST
    $scope.colorSelected = function () {
        $scope.value = $scope.selectedColor;
        product.then(function (product) {

            var colorType = $scope.selectedColor.value //FOR EXAMPLE EJ3
            var sizeType = $scope.selectedSize //FOR EXAMPLE LARGE
            productService.color = colorType
            productService.size = sizeType

            var images = getImages(product, colorType, sizeType)
            printImage(images)
        })
    };

    //WHEN COLOR SELECTED FROM DROPDOWN LIST
    $scope.sizeSelected = function () {
        $scope.value = $scope.selectedSize;
        product.then(function (product) {

            if (typeof $scope.selectedColor != 'undefined') {
                var colorType = $scope.selectedColor.value //FOR EXAMPLE EJ3
                productService.color = colorType
            }
            if (typeof $scope.selectedSize != 'undefined') {
                var sizeType = $scope.selectedSize //FOR EXAMPLE LARGE
                productService.size = sizeType
            }

            var images = getImages(product, colorType, sizeType)
            printImage(images)
        })
    };

    //PRINT IMAGE
    printImage = function (product) {
        if (product === null) {
            $scope.selectedImage = '/images/products/default.png'
        } else {
            $scope.selectedImage = '/images/' + product.images[0].link //PRINT FIRST COLOR
        }
    }

    //GET ALL IMAGES OF A PRODUCT WITH SELECTED TYPE
    getImages = function (product, colorType, sizeType) {
        for (var i = 0; i < product.image_groups.length; i++) {
            if (product.image_groups[i].variation_value === colorType && product.image_groups[i].view_type.toUpperCase() === sizeType.toUpperCase()) {
                return product.image_groups[i]
            }
        }
        return null
    }
});


app.controller('priceController', function ($scope, productService) {
    var product = productService.product()
    product.then(function (product) {
        var price = product.price
        $scope.newPrice = price
        $scope.selected = function () {
            $scope.value = $scope.selectedCurrency;

            var newPrice = 0
            switch ($scope.value) {
                case 'TRY':
                    newPrice = 3.81155664 * price;
                    break;
                case 'USD':
                    newPrice = price;
                    break;
                case 'EUR':
                    newPrice = 0.812512696 * price;
                    break;
                case 'GBP':
                    newPrice = 0.721870511 * price;
                    break;
                case 'RON':
                    newPrice = 3.7852979 * price;
                    break;
            }

            $scope.newPrice = newPrice.toFixed(2)

        };
    });

    $scope.currencies = [
        "USD",
        "TRY",
        "EUR",
        "GBP",
        "RON"
    ]
});

app.controller('productInformationController', function ($scope, productService) {
    var product = productService.product()
    product.then(function (product) {
        $scope.title = (typeof product.page_title != 'undefined') ? product.page_title : product.id
        $scope.name = product.name
        $scope.page_description = product.page_description
    })
})

app.controller('buttonController', ['$timeout', '$http', '$scope', '$location', 'productService', function ($timeout, $http, $scope, $location, productService) {
    var url = $location.absUrl().split('/').pop()
    var token = localStorage.getItem('jwt')


    $scope.addBasket = function () {
        var color = (productService.color) ? productService.color : 'default'
        var size = (productService.size) ? productService.size : 'default'

        var itemId = url;
        $http.post('/api/addBasket', {
            token: token,
            itemId: itemId,
            color: color,
            size: size
        }).then(function (response) {
            var info = response.data.info
            var status = response.data.success
            console.log(response)
            if (status) {
                if (info) {
                    $scope.alreadyInBasketAlert = true
                    $timeout(function () {
                        $scope.alreadyInBasketAlert = false
                    }, 2000);
                } else {
                    angular.element('#basketCount')[0].innerText++;
                    $scope.basketAlert = true
                    $timeout(function () {
                        $scope.basketAlert = false
                    }, 2000);
                }
            }
        })
    }

    $scope.addWishlist = function () {
        var itemId = url;
        var color = (productService.color) ? productService.color : 'default'
        var size = (productService.size) ? productService.size : 'default'
        $http.post('/api/addWishlist', {
            token: token,
            itemId: itemId,
            color: color,
            size: size
        }).then(function (response) {
            var info = response.data.info
            var status = response.data.success
            
            if (status) {
                if (info) {
                    $scope.alreadyInWishlistAlert = true
                    $timeout(function () {
                        $scope.alreadyInWishlistAlert = false
                    }, 2000);
                } else {
                    angular.element('#wishlistCount')[0].innerText++;
                    $scope.wishlistAlert = true
                    $timeout(function () {
                        $scope.wishlistAlert = false
                    }, 2000);
                }
            }

        })
    }
}])

app.controller('reviewController', ['$http', '$scope', '$location', 'productService', function ($http, $scope, $location, productService) {

    $scope.range = function (min, max, step) {
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i += step) {
            input.push(i);
        }
        return input;
    };

    $scope.reviews = [];
    var response = productService.GetReview();

    response.then(function (response) {
        if (response) {
            var reviews = response.reviews
            for (var i = 0; i < reviews.length; i++) {
                var status = ''
                switch (reviews[i].star) {
                    case '1':
                        status = 'bad'
                        break
                    case '2':
                        status = 'weak'
                        break
                    case '3':
                        status = 'average'
                        break
                    case '4':
                        status = 'good'
                        break
                    case '5':
                        status = 'perfect'
                        break
                }
                var review = {
                    username: reviews[i].username,
                    star: reviews[i].star,
                    message: reviews[i].message,
                    status: status
                }
                $scope.reviews.push(review)

            }
            console.log($scope.reviews)

        }
    })


    $scope.addReview = function () {
        var token = localStorage.getItem('jwt')
        var star = $scope.star
        var message = $scope.message
        var url = $location.absUrl();
        var pid = url.split('/').pop()
        console.log(message)
        if(typeof message != 'undefined' && message.length > 0){
            $http.post('/api/addReview', {
                token: token,
                pid: pid,
                star: star,
                message: message
            }).then(function (response) {
                
                var review = response.data.reviews
                var status = ''
                switch (review.star) {
                    case '1':
                        status = 'bad'
                        break
                    case '2':
                        status = 'weak'
                        break
                    case '3':
                        status = 'average'
                        break
                    case '4':
                        status = 'good'
                        break
                    case '5':
                        status = 'perfect'
                        break
                }
                review.status = status
                $scope.reviews.push(review)
            })
        }
        else{
            if(typeof star == 'undefined'){
                $scope.starStatus = false
            }
            if(typeof message == 'undefined' || message == ""){
                $scope.reviewForm.message.$setValidity("empty", false)
            }
        }    
    }

    $scope.messageChange = function(){
        $scope.reviewForm.message.$setValidity("empty", true)
    }
}])

app.factory('productService', ['$http', '$location', function ($http, $location) {
    var service = {};
    service.color = null
    service.size = null
    service.product = GetProduct
    service.AddReview = AddReview
    service.GetReview = GetReview
    return service

    //POST REQUEST TO GET PRODUCT
    function GetProduct() {
        var url = $location.absUrl();
        var pid = url.split('/').pop()
        return $http.post('/api/getProductById', {
            pid: pid
        }).then(function (response) {
            if (response.data.success === true) {
                return response.data.product
            }
        })
    }

    function AddReview(star, message, token) {
        var url = $location.absUrl();
        var pid = url.split('/').pop()

        return $http.post('/api/addReview', {
            token: token,
            pid: pid,
            star: star,
            message: message
        }).then(function (response) {
            return response.data
        })
    }

    function GetReview() {
        var url = $location.absUrl();
        var pid = url.split('/').pop()
        return $http.post('/api/getReview', {
            pid: pid
        }).then(function (response) {

            return response.data

        })
    }
}])