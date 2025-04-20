precision mediump float;

const float pi=3.14159265359;
const float invPi=1./pi;

const float zenithOffset=.1;
const float multiScatterPhase=.1;
const float density=.7;

const float anisotropicIntensity=0.;//Higher numbers result in more anisotropic scattering

const vec3 skyColor=vec3(.39,.57,1.)*(1.+anisotropicIntensity);//Make sure one of the conponents is never 0.0

#define smooth(x)x*x*(3.-2.*x)
#define zenithDensity(x)density/pow(max(x-zenithOffset,.35e-2),.75)

vec3 getSkyAbsorption(vec3 x,float y){
    
    vec3 absorption=x*-y;
    absorption=exp2(absorption)*2.;
    
    return absorption;
}

float getSunPoint(vec2 p,vec2 lp){
    return smoothstep(.03,.026,distance(p,lp))*50.;
}

float getRayleigMultiplier(vec2 p,vec2 lp){
    return 1.+pow(1.-clamp(distance(p,lp),0.,1.),2.)*pi*.5;
}

float getMie(vec2 p,vec2 lp){
    float disk=clamp(1.-pow(distance(p,lp),.1),0.,1.);
    
    return disk*disk*(3.-2.*disk)*2.*pi;
}

uniform vec2 iResolution;
uniform vec2 iMouse;

vec3 getAtmosphericScattering(vec2 p,vec2 lp){
    vec2 correctedLp=lp/max(iResolution.x,iResolution.y)*vec2(iResolution.x,iResolution.y);
    
    float zenith=zenithDensity(p.y);
    float sunPointDistMult=clamp(length(max(correctedLp.y+multiScatterPhase-zenithOffset,0.)),0.,1.);
    
    float rayleighMult=getRayleigMultiplier(p,correctedLp);
    
    vec3 absorption=getSkyAbsorption(skyColor,zenith);
    vec3 sunAbsorption=getSkyAbsorption(skyColor,zenithDensity(correctedLp.y+multiScatterPhase));
    vec3 sky=skyColor*zenith*rayleighMult;
    vec3 sun=getSunPoint(p,correctedLp)*absorption;
    vec3 mie=getMie(p,correctedLp)*sunAbsorption;
    
    vec3 totalSky=mix(sky*absorption,sky/(sky+.5),sunPointDistMult);
    totalSky+=sun+mie;
    totalSky*=sunAbsorption*.5+.5*length(sunAbsorption);
    
    return totalSky;
}

vec3 jodieReinhardTonemap(vec3 c){
    float l=dot(c,vec3(.2126,.7152,.0722));
    vec3 tc=c/(c+1.);
    
    return mix(c/(l+1.),tc,tc);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    
    vec2 position=fragCoord.xy/max(iResolution.x,iResolution.y)*2.;
    vec2 lightPosition=iMouse/iResolution;
    
    vec3 color=getAtmosphericScattering(position,lightPosition)*pi;
    color=jodieReinhardTonemap(color);
    color=pow(color,vec3(2.2));//Back to linear
    
    fragColor=vec4(color,1.);
    
}

void main(){
    mainImage(gl_FragColor,gl_FragCoord.xy);
}